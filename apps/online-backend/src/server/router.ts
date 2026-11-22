import koaBody from 'koa-body';
import { unlink } from 'node:fs/promises';
import * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { GameType } from 'schemas';
import type { SocketIOButBotMoves } from '../socketio_botmoves';
import { allowedToViewStrategy, getNewGame, createGame, injectBot, injectPlayer } from './team_manage';
import { adminTeamView, adminTeamViews, deriveMatchStatus, teamMatches } from './match_status';
import { import_teams_from_tsv } from './team_import';
import { publicTeamView } from './team_view';
import { readStartWindowBody, withCompetitionWindow } from './start_window';
import { TeamState, clearTeamCookie, requireJson, requireTeam, setTeamCookie } from './team_session';
import { JOIN_ATTEMPT_LIMIT, JOIN_ATTEMPT_WINDOW_SECONDS, rateLimit } from './rate_limit';
import type { requireAdmin } from './admin_session';
import { AnyBgioGame, PlayerIDType } from 'game';
import { apiErrorBody, refuse } from './api_error';
import { TeamModel, appendOtherNote } from './model';
import { importBundle } from './database_sources';
import type { ContentSources } from './database_sources';

/** What the routes use of the socket transport `server.ts` puts on the
 *  context, which koa's context types as `any`. */
type MatchTransport = Pick<SocketIOButBotMoves, "getMatchQueue" | "publishUpdate">;

/**
 *
 * Big factory to set up the Router for the API, and also contains API function implementations.
 *
 * @param router - Koa Router
 * @param teams - List of teams, provided as a TeamsRepository
 * @param games - List of possible games for teams
 * @param adminAuth - The organisers' login, from `requireAdmin`. Passed in
 *   rather than built here so a test can serve the routes without the
 *   environment the real password comes from. Every `/team/admin` and
 *   `/game/admin` route below names it; `server/admin_session.ts` says why it
 *   hangs on the routes instead of on the prefix they share.
 * @param sources - Where the competitions and the relays' problems are read
 *   from, per request, so a competition the source starts returning later is
 *   served without a restart.
 */
export function configureTeamsRouter(
  router: Router<DefaultState, Server.AppCtx>,
  teams: TeamsRepository,
  games: AnyBgioGame[],
  adminAuth: ReturnType<typeof requireAdmin>,
  sources: ContentSources,
) {
  const { competitionSource: competitions, problemSource: problems } = sources;
  // Per router rather than per module, so its counts belong to the server it
  // serves and a test starts with an empty one.
  const joinLimit = rateLimit({ limit: JOIN_ATTEMPT_LIMIT, windowSeconds: JOIN_ATTEMPT_WINDOW_SECONDS });

  // First, so every route below answers a refusal as `{ code, message }`.
  router.use(apiErrorBody);

  // The team's competition with the window set on the admin page in force:
  // read per request, since an organiser may change one mid-round.
  async function competitionNow(team: TeamModel) {
    return withCompetitionWindow(await competitions.getCompetition(team.competitionId), await teams.competitionWindows());
  }

  // Overlapping starts can both pass `allowedToStart`; the conditional write
  // picks one, and the loser's match, which no team points at, is wiped.
  async function claimStart(ctx: Server.AppCtx, team: TeamModel, gameType: GameType, matchID: string) {
    if (!(await teams.startMatch(team, gameType, matchID))) {
      await ctx.db.wipe(matchID);
      refuse(ctx, 403, "START_NOT_ALLOWED", "Team is not allowed to start game.");
    }
  }

  // boardgame.io's lobby API, which nothing here uses, closed as one prefix so
  // a route a later version adds is closed too. It runs first only because
  // `server.run()` adds boardgame.io's routes to this router after ours.
  // A status rather than a throw: nothing has gone wrong when someone scans
  // this prefix, and anyone may.
  router.use("/games", (ctx) => {
    ctx.status = 404;
  });

  /**
   * Get the log data about a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {LogEntry[]} - A list of log objects.
   */
  router.get("/game/admin/:matchId/logs", adminAuth, async (ctx) => {
    const matchID = ctx.params.matchId;
    const { log } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      log: true,
    });
    if (!log) {
      refuse(ctx, 404, "MATCH_NOT_FOUND", "Match " + matchID + " not found");
    }
    ctx.body = log;
  });

  /**
   * Get the state data of a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {State<any>} - A match state object object.
   */
  router.get("/game/admin/:matchId/state", adminAuth, async (ctx) => {
    const matchID = ctx.params.matchId;
    const { state } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      state: true,
    });
    if (!state) {
      refuse(ctx, 404, "MATCH_NOT_FOUND", "Match " + matchID + " not found");
    }
    ctx.body = state;
  });

  /**
 * Add extra timeto a specific match.
 *
 * @param {string} matchId - The ID of the match.
 * @param {integer} minutes - How many minutes to add
 * @returns {State<any>} - A match state object object.
 */
  router.post("/game/admin/:matchId/addminutes/:minutes", adminAuth, async (ctx) => {
    const matchID = ctx.params.matchId;
    const minutes = Number(ctx.params.minutes);
    // The read, the checks, the write and the team's note are one job on the
    // match's queue, which every move and bot turn also runs on: built from a
    // state a move then replaced, the write would drop that move or itself
    // (#655). The queue is per process, so this holds only while one backend
    // serves a match; with several, the extension would have to go through Master.
    const transport = ctx.durer_transport as MatchTransport;
    const { team, newEndDate } = await transport.getMatchQueue(matchID).add(async () => {
      const { state, metadata } = await (ctx.db as StorageAPI.Async).fetch(
        matchID,
        {
          state: true,
          metadata: true,
        }
      );
      if (!state) {
        refuse(ctx, 404, "MATCH_NOT_FOUND", "Match " + matchID + " not found");
      }
      const teamId = metadata.players[0].name;
      const team = await teams.getTeam({ teamId });

      if (!team) {
        throw ctx.throw(500, `Match found, but assigned team ${teamId} was not found.`);
      }

      const gameType = team.relayMatchID === matchID ? 'RELAY' : team.strategyMatchID === matchID ? 'STRATEGY' : null;
      if (gameType === null) {
        refuse(ctx, 409, "STALE_MATCH_ID", `Match ${matchID} is not the team's current match. (Probably you are using an old matchID.)`);
      }
      if (deriveMatchStatus(gameType, matchID, state, new Date()).state !== 'IN PROGRESS') {
        refuse(ctx, 409, "MATCH_FINISHED", 'Restarting an already finished match is not supported right now.');
      }

      // Before the state is written, so a match no hosted game plays (one
      // stored under a game name the server no longer hosts) is refused
      // unchanged, and a retry does not add the minutes twice.
      if (!games.some(g => g.name === metadata.gameName)) {
        refuse(ctx, 404, "GAME_NOT_FOUND", `Match found, but game ${metadata.gameName} was not found.`);
      }

      const new_state = {
        ...state,
        _stateID: state._stateID + 1
      }

      const newEndDate = new Date(state.G.end)
      newEndDate.setMinutes(newEndDate.getMinutes() + minutes)
      new_state.G.end = newEndDate.toISOString();
      new_state.G.millisecondsRemaining = newEndDate.getTime() - new Date().getTime();

      await ctx.db.setState(matchID, new_state);
      // The boards learn the new end the way they learn of another player's move.
      transport.publishUpdate(matchID, new_state);

      team.other = appendOtherNote(team.other, `te[${matchID}]:${minutes}`);
      await team.save();
      return { team, newEndDate };
    });

    ctx.body = { updatedEndTime: newEndDate, matchID: matchID, team: await adminTeamView(ctx.db, team) };

  });

  /**
   * Get metadata about a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {Server.MatchData} - A match object.
   */
  router.get("/game/admin/:matchId/metadata", adminAuth, async (ctx) => {
    const matchID = ctx.params.matchId;
    const { metadata } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      metadata: true,
    });
    if (!metadata) {
      refuse(ctx, 404, "MATCH_NOT_FOUND", "Match " + matchID + " not found");
    }
    ctx.body = metadata;
  });

  /**
     * Reset teams's strategy
     *
     * @param {string} teamID - The ID of the team.
     * @returns {TeamModel} - Returns the modified team model.
     */
  router.post("/team/admin/:teamID/reset/strategy", adminAuth, async (ctx) => {
    const teamId = ctx.params.teamID;
    const team = await teams.getTeam({ teamId });

    if (!team) {
      refuse(ctx, 404, "TEAM_NOT_FOUND", `Team not found with teamID ${teamId}.`);
    }
    if (team.pageState === 'STRATEGY')
      team.pageState = 'HOME'

    if (team.strategyMatchID !== null)
      team.other = appendOtherNote(team.other, `prevstratid:${team.strategyMatchID}`)
    team.strategyMatchID = null
    await team.save();
    ctx.body = await adminTeamView(ctx.db, team);
  });

  /**
     * Reset teams's relay
     *
     * @param {string} teamID - The ID of the team.
     * @returns {TeamModel} - Returns the modified team model.
     */
  router.post("/team/admin/:teamID/reset/relay", adminAuth, async (ctx) => {
    const teamId = ctx.params.teamID;
    const team = await teams.getTeam({ teamId });

    if (!team) {
      refuse(ctx, 404, "TEAM_NOT_FOUND", `Team not found with teamID ${teamId}.`);
    }
    if (team.pageState === 'RELAY')
      team.pageState = 'HOME'

    if (team.relayMatchID !== null)
      team.other = appendOtherNote(team.other, `prevrelayid:${team.relayMatchID}`)
    team.relayMatchID = null
    await team.save();
    ctx.body = await adminTeamView(ctx.db, team);
  });

  /**
   * Give a team a start window of its own, in place of its competition's, or
   * take it away: a body of `{ opensAt, closesAt }`, ISO 8601 with an offset,
   * `closesAt` optional; `{ opensAt: null }` takes it away. For a team writing
   * the round late, or a testing code.
   *
   * @param {string} teamID - The ID of the team.
   * @returns {TeamModel} - Returns the modified team model.
   */
  router.put("/team/admin/:teamID/start-window", adminAuth, requireJson, koaBody(), async (ctx) => {
    const teamId = ctx.params.teamID;
    const window = readStartWindowBody(ctx.request.body);
    if (window !== null && 'refused' in window) {
      refuse(ctx, 400, "INVALID_START_WINDOW", window.refused);
    }
    const team = await teams.getTeam({ teamId });
    if (!team) {
      refuse(ctx, 404, "TEAM_NOT_FOUND", `Team not found with teamID ${teamId}.`);
    }
    team.startOpensAt = window?.opensAt ?? null;
    team.startClosesAt = window?.closesAt ?? null;
    await team.save();
    ctx.body = await adminTeamView(ctx.db, team);
  });

  /**
   * Get all teams as a full object
   * @returns {TeamModel[]} - List of the selected teams
   */
  router.get("/team/admin/all", adminAuth, koaBody(), async (ctx) => {
    ctx.body = await adminTeamViews(ctx.db, await teams.listTeams() ?? []);
  })

  /**
   * The competitions the server knows, for the admin page to list with the
   * ids the import's Competition column takes: each one's id and metadata,
   * nothing of its problems, and its start window — the one in force, and
   * the one its config gives, which the admin page's replaces — and whether
   * it is held in the code or in the database.
   */
  router.get("/team/admin/competitions", adminAuth, async (ctx) => {
    const windows = await teams.competitionWindows();
    ctx.body = (await competitions.listCompetitions()).map(({ id, metadata, startWindow }) => ({
      id, metadata,
      startWindow: windows.get(id) ?? startWindow ?? null,
      configStartWindow: startWindow ?? null,
      storedIn: sources.competitions.has(id) ? 'code' : 'database',
    }));
  });

  /**
   * Write the competitions and problems of a bundle to the database: the body
   * is the bundle, as `readBundle` reads it. All of it is written, or, if any
   * part breaks the rules or has an id already taken, none; the answer is the
   * report either way, as the team import's is.
   */
  router.post("/team/admin/competitions/import", adminAuth, requireJson, koaBody(), async (ctx) => {
    ctx.body = await importBundle(teams, ctx.request.body, sources);
  });

  /**
   * Set a competition's start window in place of the one its config gives: a
   * body of `{ opensAt, closesAt }`, ISO 8601 with an offset, `closesAt`
   * optional. `{ opensAt: null }` returns it to its config's. A team with a
   * window of its own keeps that one.
   *
   * @param {string} competitionId - The id of the competition.
   */
  router.put("/team/admin/competitions/:competitionId/start-window", adminAuth, requireJson, koaBody(), async (ctx) => {
    const { competitionId } = ctx.params;
    if (await competitions.getCompetition(competitionId) === undefined) {
      refuse(ctx, 404, "COMPETITION_NOT_FOUND", `No competition with id ${competitionId}.`);
    }
    const window = readStartWindowBody(ctx.request.body);
    if (window !== null && 'refused' in window) {
      refuse(ctx, 400, "INVALID_START_WINDOW", window.refused);
    }
    await teams.setCompetitionWindow(competitionId, window);
    ctx.status = 204;
  });

  /**
   * Import teams from an uploaded TSV, the way `npm run teams:import` does.
   * formidable stores the upload under a random name, so the extension is
   * checked on the name the client sent.
   */
  router.put("/team/admin/import", adminAuth, koaBody({ multipart: true }), async (ctx) => {
    const { file } = ctx.request.files ?? refuse(ctx, 400, "IMPORT_NO_FILE", 'No files uploaded!');
    try {
      if (Array.isArray(file)) {
        refuse(ctx, 400, "IMPORT_MULTIPLE_FILES", 'Multiple files are not supported.');
      }
      if (!file?.originalFilename?.endsWith('.tsv')) {
        refuse(ctx, 400, "IMPORT_NOT_TSV", 'Invalid file format. Only TSV files are allowed.');
      }
      ctx.body = await import_teams_from_tsv(teams, file.filepath, competitions);
    } finally {
      // Every field, not only `file`: formidable writes whatever is uploaded.
      const uploaded = Object.values(ctx.request.files ?? {}).flat();
      await Promise.all(uploaded.map(f => unlink(f.filepath).catch(() => undefined)));
    }
  })

  /**
   * Log a team in: the join code answered with the session cookie.
   *
   * The code travels in the body, never in the path — it is the team's login
   * secret, and a path lands in access logs and browser history. What the
   * cookie is and why, and why the body must be JSON, is `team_session.ts`.
   *
   * This is the one route where an unauthenticated client guesses at a secret,
   * so it is the one the attempt limit is on — `rate_limit.ts` for the numbers.
   * It runs before the body parser: a client over its limit is answered
   * without reading what it sent.
   *
   * @param {string} code - the team's join code, as `{ "code": ... }`
   */
  router.post("/team/join", joinLimit, requireJson, koaBody(), async (ctx) => {
    const sent: unknown = (ctx.request.body as { code?: unknown } | undefined)?.code;
    const code = typeof sent === "string" ? sent : refuse(ctx, 400, "JOIN_INVALID_BODY", "Expected { code: string }.");
    const team = await teams.getTeam({ joinCode: code }) ?? refuse(ctx, 404, "UNKNOWN_JOIN_CODE", "No team has this join code.");
    setTeamCookie(ctx, team.teamId);
    ctx.status = 204;
  });

  /**
   * Log a team out: the session cookie expired.
   *
   * No `requireTeam` here — a cookie naming no team must still be cleared.
   * `requireJson` is: the cookie's `SameSite` keeps it off a form another site
   * submits here, but the browser still honours the expiry this answers with,
   * so without it any site could log the team out.
   */
  router.post("/team/me/logout", requireJson, async (ctx) => {
    clearTeamCookie(ctx);
    ctx.status = 204;
  });

  /**
   * The logged-in team's own state.
   *
   * @returns {PublicTeamView} - the team's own state, without its secrets
   */
  router.get<TeamState>("/team/me", requireTeam(teams), async (ctx) => {
    const team = ctx.state.team;
    ctx.body = publicTeamView(team, await teamMatches(ctx.db, team), await competitionNow(team));
  });

  /**
   * Let the logged-in team start a RELAY match.
   */
  router.post<TeamState>("/team/me/relay/play", requireTeam(teams), async (ctx) => {
    const { game, team, setupData } =
      await getNewGame(ctx, games, "RELAY", ctx.state.team, await competitionNow(ctx.state.team), problems);

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx, setupData);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    await claimStart(ctx, team, "RELAY", body.matchID);
    ctx.body = body;
  });

  /**
   * Let the logged-in team start a STRATEGY match.
   */
  router.post<TeamState>("/team/me/strategy/play", requireTeam(teams), async (ctx) => {
    const { game, team, setupData } =
      await getNewGame(ctx, games, "STRATEGY", ctx.state.team, await competitionNow(ctx.state.team), problems);

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx, setupData);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    await claimStart(ctx, team, "STRATEGY", body.matchID);
    ctx.body = body;
  });

  /**
   * Take the logged-in team back to its finished STRATEGY match, to look at
   * the board as it ended (#728).
   */
  router.post<TeamState>("/team/me/strategy/view", requireTeam(teams), async (ctx) => {
    const team = ctx.state.team;
    const matches = await teamMatches(ctx.db, team);
    if (!allowedToViewStrategy(team, matches))
      refuse(ctx, 403, "VIEW_NOT_ALLOWED", "Team is not allowed to view the strategy match.");
    // A start landing after this read changes a match id, and the write refuses.
    if (!(await teams.viewStrategy(team)))
      refuse(ctx, 403, "VIEW_NOT_ALLOWED", "Team is not allowed to view the strategy match.");

    team.set({ pageState: "STRATEGY" });
    ctx.body = publicTeamView(team, matches, await competitionNow(team));
  });

  /**
   * Let the logged-in team set their PageState to HOME
   */
  router.post<TeamState>("/team/me/gohome", requireTeam(teams), async (ctx) => {
    const team = ctx.state.team;
    const matches = await teamMatches(ctx.db, team);
    if (matches.relayMatch.state === 'IN PROGRESS' || matches.strategyMatch.state === 'IN PROGRESS')
      refuse(ctx, 403, "MATCH_IN_PROGRESS", "Not allowed, match in progress.");
    // A start landing after this read changes a match id, and the write refuses.
    if (!(await teams.goHome(team)))
      refuse(ctx, 403, "MATCH_IN_PROGRESS", "Not allowed, match in progress.");

    team.set({ pageState: "HOME" });
    ctx.body = publicTeamView(team, matches, await competitionNow(team));
  });
}
