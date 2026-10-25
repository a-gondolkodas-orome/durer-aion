import koaBody from 'koa-body';
import { unlink } from 'node:fs/promises';
import * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { isCompetitionCategory } from 'schemas';
import { TransportAPI } from '../socketio_botmoves';
import { getFilterPlayerView } from "boardgame.io/internal";
import { getNewGame, createGame, extendedEnd, extensionRefusal, injectBot, injectPlayer } from './team_manage';
import { adminTeamView, teamMatches } from './match_status';
import { import_teams_from_tsv } from './team_import';
import { publicTeamView } from './team_view';
import { TeamState, clearTeamCookie, requireJson, requireTeam, setTeamCookie } from './team_session';
import { JOIN_ATTEMPT_LIMIT, JOIN_ATTEMPT_WINDOW_SECONDS, rateLimit } from './rate_limit';
import type { requireAdmin } from './admin_session';
import { AnyBgioGame, PlayerIDType } from 'game';
import { appendOtherNote } from './model';
import { UniqueConstraintError } from 'sequelize';

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
 */
export function configureTeamsRouter(
  router: Router<DefaultState, Server.AppCtx>,
  teams: TeamsRepository,
  games: AnyBgioGame[],
  adminAuth: ReturnType<typeof requireAdmin>
) {
  // Per router rather than per module, so its counts belong to the server it
  // serves and a test starts with an empty one.
  const joinLimit = rateLimit({ limit: JOIN_ATTEMPT_LIMIT, windowSeconds: JOIN_ATTEMPT_WINDOW_SECONDS });

  // boardgame.io's lobby API, which nothing here uses, closed as one prefix so
  // a route a later version adds is closed too. It runs first only because
  // `server.run()` adds boardgame.io's routes to this router after ours.
  // A status rather than a throw: koa reports every thrown error, a 404
  // included, to server.ts's Sentry hook, and this prefix is anyone's to scan.
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
      ctx.throw(404, "Match " + matchID + " not found");
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
      ctx.throw(404, "Match " + matchID + " not found");
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
    const { state, metadata } = await (ctx.db as StorageAPI.Async).fetch(
      matchID,
      {
      state: true,
        metadata: true,
      }
    );
    if (!state) {
      ctx.throw(404, "Match " + matchID + " not found");
    }
    const teamId = metadata.players[0].name;
    const team = await teams.getTeam({ teamId });

    if (!team) {
      ctx.throw(500, `Match found, but assigned team ${teamId} was not found.`);
      return;
    }

    const refusal = extensionRefusal(team, matchID, state.ctx.gameover, await teamMatches(ctx.db, team));
    if (refusal !== null) {
      ctx.throw(501, refusal);
    }

    const newEndDate = extendedEnd(state.G.end, minutes, new Date());
    const new_state = {
      ...state,
      _stateID: state._stateID + 1
    }
    new_state.G.end = newEndDate.toISOString();
    new_state.G.millisecondsRemaining = newEndDate.getTime() - new Date().getTime();

    await ctx.db.setState(matchID, new_state);

    const game = games.find(g => g.name === metadata.gameName);
    if (!game) {
      ctx.throw(404, `Match found, but game ${metadata.gameName} was not found.`);
      return
    }

    /* Hijacking the internal transport API used ot send backend updates to the frontend to send an update to the frontend
    This is a bit hacky, but it mainly simulates a similar effect as what would happen if a different user changes teh gamestate irl
    This is generally equal to what would happen if multiple players play the game, and one does some actions.
    The other players would see the updated gamestate, and the frontend would update accordingly.
    The normal way to use this, is to create a Master authoritative object, which handles validations, and other logics.
    Here we already handled the validation, and uploaded it to the database, so we can just send the updated gamestate to the frontend.
    This is possible, because the publish functionality of the PubSub implementation,if we use a SendAll function, can be reconstructed easily from the transport layer we defined from the botmoves already. */
    const my_transportAPI = TransportAPI(matchID, null /* we are only using sendAll */, getFilterPlayerView(game), ctx.durer_transport.pubSub)

    my_transportAPI.sendAll(
      {
        type: 'update',
        args: [matchID, new_state]
      }
    )

    // The team's page decides what its client shows, so a team that went home
    // from a match whose time was up could not get back into it otherwise.
    team.pageState = team.relayMatchID === matchID ? "RELAY" : "STRATEGY";
    team.other = appendOtherNote(team.other, `te[${matchID}]:${minutes}`);
    await team.save();

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
      ctx.throw(404, "Match " + matchID + " not found");
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
      ctx.throw(404, `Team not found with teamID ${teamId}.`);
      return;
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
      ctx.throw(404, `Team not found with teamID ${teamId}.`);
      return;
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
   * Correct a team's name or category, before either of its matches has
   * started. `TeamsRepository.editTeam` has the rules and the audit trail.
   *
   * @param {string} teamID - The ID of the team.
   * @param {{ teamName?: string, category?: "C" | "D" | "E" }} body - The
   *   fields to change; one left out stays as it is.
   * @returns {TeamModel} - The team as edited. 409 with `{ reason }` when a
   *   match has started (`started`), another team has the name
   *   (`name-taken`), or the audit notes do not fit (`notes-full`).
   */
  router.patch("/team/admin/:teamID", adminAuth, koaBody(), async (ctx) => {
    const body = ctx.request.body as { teamName?: unknown, category?: unknown } | undefined;
    const sentName = body?.teamName;
    const sentCategory = body?.category;
    const teamName = sentName === undefined ? undefined
      : typeof sentName === "string" ? sentName.trim()
      : ctx.throw(400, "Expected teamName to be a string.");
    if (teamName !== undefined && (teamName.length < 1 || teamName.length > 255)) {
      ctx.throw(400, "Teamname must be between 1 and 255 characters.");
    }
    const category = sentCategory === undefined || isCompetitionCategory(sentCategory) ? sentCategory
      : ctx.throw(400, "Expected category to be C, D or E.");
    const edited = await teams.editTeam(ctx.params.teamID, { teamName, category }).catch((error: unknown) => {
      if (error instanceof UniqueConstraintError) return 'name-taken' as const;
      throw error;
    });
    if (edited === 'not-found') {
      ctx.throw(404, `Team not found with teamID ${ctx.params.teamID}.`);
    }
    if (typeof edited === 'string') {
      ctx.status = 409;
      ctx.body = { reason: edited };
      return;
    }
    ctx.body = await adminTeamView(ctx.db, edited);
  });

  /**
   * Run a user defined filter query on teams
   *
   * @param {string|string[]} filter - Get parameter to pass the filter
   * @returns {TeamModel[]} - List of the selected teams
   */
  router.get("/team/admin/filter", adminAuth, koaBody(), async (ctx) => {
    const filter_string: string | string[] | undefined =
      ctx.request.query["filter"];
    let filters: string[];
    if (filter_string === undefined) {
      filters = [];
    } else if (typeof filter_string === "string") {
      filters = filter_string.split(",");
    } else {
      filters = filter_string;
    }
    ctx.body = await Promise.all((await teams.fetch(filters)).map(team => adminTeamView(ctx.db, team)));
  });

  /**
   * Get all teams as a full object
   * @returns {TeamModel[]} - List of the selected teams
   */
  router.get("/team/admin/all", adminAuth, koaBody(), async (ctx) => {
    ctx.body = await Promise.all((await teams.listTeams() ?? []).map(team => adminTeamView(ctx.db, team)));
  })

  /**
   * Import teams from an uploaded TSV, the way `npm run teams:import` does.
   * formidable stores the upload under a random name, so the extension is
   * checked on the name the client sent.
   */
  router.put("/team/admin/import", adminAuth, koaBody({ multipart: true }), async (ctx) => {
    const { file } = ctx.request.files ?? ctx.throw(400, 'No files uploaded!');
    try {
      if (Array.isArray(file)) {
        ctx.throw(400, 'Multiple files are not supported.');
        return;
      }
      if (!file?.originalFilename?.endsWith('.tsv')) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid file format. Only TSV files are allowed.' };
        return;
      }
      ctx.body = await import_teams_from_tsv(teams, file.filepath);
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
    const code = typeof sent === "string" ? sent : ctx.throw(400, "Expected { code: string }.");
    const team = await teams.getTeam({ joinCode: code }) ?? ctx.throw(404, "Team not found!");
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
    ctx.body = publicTeamView(team, await teamMatches(ctx.db, team));
  });

  /**
   * Let the logged-in team start a RELAY match.
   */
  router.post<TeamState>("/team/me/relay/play", requireTeam(teams), async (ctx) => {
    const { game, team } = await getNewGame(ctx, games, "RELAY", ctx.state.team);

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    await team.update({
      pageState: "RELAY",
      relayMatchID: body.matchID,
    });
    ctx.body = body;
  });

  /**
   * Let the logged-in team start a STRATEGY match.
   */
  router.post<TeamState>("/team/me/strategy/play", requireTeam(teams), async (ctx) => {
    const { game, team } = await getNewGame(ctx, games, "STRATEGY", ctx.state.team);

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    await team.update({
      pageState: "STRATEGY",
      strategyMatchID: body.matchID,
    });
    ctx.body = body;
  });

  /**
   * Let the logged-in team set their PageState to HOME
   */
  router.post<TeamState>("/team/me/gohome", requireTeam(teams), async (ctx) => {
    const team = ctx.state.team;
    const matches = await teamMatches(ctx.db, team);
    if (matches.relayMatch.state === 'IN PROGRESS' || matches.strategyMatch.state === 'IN PROGRESS')
      ctx.throw(403, "Not allowed, match in progress.")

    await team.update({
      pageState: "HOME",
    });
    ctx.body = publicTeamView(team, matches);
  });
}
