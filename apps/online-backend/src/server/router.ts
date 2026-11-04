import koaBody from 'koa-body';
import * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { GameType } from 'schemas';
import { TransportAPI } from '../socketio_botmoves';
import { getFilterPlayerView } from "boardgame.io/internal";
import { getNewGame, createGame, injectBot, injectPlayer } from './team_manage';
import { adminTeamView, adminTeamViews, deriveMatchStatus, teamMatches } from './match_status';
import { CouldNotGenerate, importTeamsFromTsv } from './team_import';
import { publicTeamView } from './team_view';
import { TeamState, clearTeamCookie, requireJson, requireTeam, setTeamCookie } from './team_session';
import { JOIN_ATTEMPT_LIMIT, JOIN_ATTEMPT_WINDOW_SECONDS, rateLimit } from './rate_limit';
import { requireTsv } from './admin_session';
import type { requireAdmin } from './admin_session';
import { AnyBgioGame, PlayerIDType } from 'game';
import { TeamModel, appendOtherNote } from './model';

// What a team import may weigh. koa-body's own default is 56 kB, which is about
// 300 teams — fewer than a competition imports. A row is ~250 bytes of real
// registration data and 1.9 kB at its widest legal size, so this clears several
// thousand teams either way. nginx has to allow it too
// (apps/online-frontend/nginx/nginx.conf).
const TSV_BODY_LIMIT = '8mb';

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

  // Overlapping starts can both pass `allowedToStart`; the conditional write
  // picks one, and the loser's match, which no team points at, is wiped.
  async function claimStart(ctx: Server.AppCtx, team: TeamModel, gameType: GameType, matchID: string) {
    if (!(await teams.startMatch(team, gameType, matchID))) {
      await ctx.db.wipe(matchID);
      ctx.throw(403, "Team is not allowed to start game.");
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

    const gameType = team.relayMatchID === matchID ? 'RELAY' : team.strategyMatchID === matchID ? 'STRATEGY' : null;
    if (gameType === null) {
      ctx.throw(501, `Match ${matchID} is not the team's current match. (Probably you are using an old matchID.)`);
      return;
    }
    if (deriveMatchStatus(gameType, matchID, state, new Date()).state !== 'IN PROGRESS') {
      ctx.throw(501, 'Restarting an already finished match is not supported right now.');
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
    ctx.body = await adminTeamViews(ctx.db, await teams.fetch(filters));
  });

  /**
   * Get all teams as a full object
   * @returns {TeamModel[]} - List of the selected teams
   */
  router.get("/team/admin/all", adminAuth, koaBody(), async (ctx) => {
    ctx.body = await adminTeamViews(ctx.db, await teams.listTeams() ?? []);
  })

  /**
   * Load a TSV of teams: the whole file or none of it.
   *
   * The file is the body, not a multipart upload. An upload is written to the
   * OS temp directory before the handler sees it, and the file carries join
   * codes — every team's login secret — so it is on disk for as long as the
   * request takes, and for good if the process dies before it is unlinked. A
   * body is read into memory and gone with the request, and it is also the
   * only shape a paste into the admin page can take.
   *
   * The size cap is not the default: koa-body admits 56 kB of text, which is
   * about 300 teams, and a competition imports more than that in one file.
   *
   * @param {string} dryRun - `1` to check the file and write nothing. It is how
   *   the admin page reports the clashes with live teams that a check in the
   *   browser cannot see. An unrecognised value is refused rather than taken
   *   for a real import, which would write the file it was asked to test.
   * @returns {ImportResult} - What loaded, and everything wrong with the file.
   */
  router.put("/team/admin/import", adminAuth, requireTsv, koaBody({
    text: true,
    multipart: false,
    textLimit: TSV_BODY_LIMIT,
  }), async (ctx) => {
    const asked = ctx.request.query["dryRun"];
    const dryRun = asked === undefined ? false
      : asked === "1" || asked === "true" ? true
        : ctx.throw(400, "Expected dryRun=1.");

    const sent: unknown = ctx.request.body;
    const content = typeof sent === "string" ? sent : "";
    if (content.trim() === "") {
      ctx.throw(400, "Expected a TSV body.");
    }

    try {
      ctx.body = await importTeamsFromTsv(teams, content, { dryRun });
    } catch (error) {
      if (!(error instanceof CouldNotGenerate)) throw error;
      // A hundred generated values in a row already in use is a broken
      // generator, not a fault in the file, so it is not one of the problems an
      // ImportResult carries. `expose` because koa keeps a 5xx message to
      // itself — without it the admin gets "Internal Server Error" and no way
      // to tell a dead generator from a dead database. Nothing was written:
      // the draws all happen before the insert.
      ctx.throw(503, `${error.message} Nothing was imported.`, { expose: true });
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

    await claimStart(ctx, team, "RELAY", body.matchID);
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

    await claimStart(ctx, team, "STRATEGY", body.matchID);
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
    // A start landing after this read changes a match id, and the write refuses.
    if (!(await teams.goHome(team)))
      ctx.throw(403, "Not allowed, match in progress.")

    team.set({ pageState: "HOME" });
    ctx.body = publicTeamView(team, matches);
  });
}
