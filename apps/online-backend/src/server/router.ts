import koaBody from 'koa-body';
import * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { InProgressMatchStatus } from 'schemas';
import { TransportAPI } from '../socketio_botmoves';
import { getFilterPlayerView } from "boardgame.io/internal";
import { closeMatch, getNewGame, checkStaleMatch, startMatchStatus, createGame, injectBot, injectPlayer } from './team_manage';
import { importTeamsFromTsv } from './team_import';
import { publicTeamView } from './team_view';
import { TeamState, clearTeamCookie, requireJson, requireTeam, setTeamCookie } from './team_session';
import { JOIN_ATTEMPT_LIMIT, JOIN_ATTEMPT_WINDOW_SECONDS, rateLimit } from './rate_limit';
import { requireTsv } from './admin_session';
import type { requireAdmin } from './admin_session';
import { AnyBgioGame, PlayerIDType } from 'game';
import { UniqueConstraintError } from 'sequelize';

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
    // Fetch team
    const teamId = metadata.players[0].name;
    const team = await teams.getTeam({ teamId });

    if (!team) {
      ctx.throw(500, `Match found, but assigned team ${teamId} was not found.`);
      return;
    }

    const new_state = {
      ...state,
      //manually increment stateID
      _stateID: state._stateID + 1
    }

    //Update  new_state
    const newEndDate = new Date(state.G.end)
    newEndDate.setMinutes(newEndDate.getMinutes() + minutes)
    new_state.G.end = newEndDate.toISOString();
    new_state.G.millisecondsRemaining = newEndDate.getTime() - new Date().getTime();

    //Update team
    if (team.strategyMatch.state === "IN PROGRESS") {
      if (team.strategyMatch.matchID !== matchID) {
        ctx.throw(501, `IN PROGRESS strategy match found (${team.strategyMatch.matchID}), but it does not match with matchID (${matchID}). (Probably you are using an old matchID.)`);
      }
      await team.update({
        strategyMatch: {
          state: "IN PROGRESS",
          matchID: matchID,
          startAt: new Date(new_state.G.start),
          endAt: newEndDate,
        }
      })
    }
    else if (team.relayMatch.state === "IN PROGRESS") {
      if (team.relayMatch.matchID !== matchID) {
        ctx.throw(501, `IN PROGRESS relay match found (${team.relayMatch.matchID}), but it does not match with matchID (${matchID}). (Probably you are using an old matchID.)`);
      }
      await team.update({
        relayMatch: {
          state: "IN PROGRESS",
          matchID: matchID,
          startAt: new Date(new_state.G.start),
          endAt: newEndDate,
        }
      })
    }
    else {
      ctx.throw(501, 'Restarting an already finished match is not supported right now.');
    }

    await ctx.db.setState(matchID, new_state);

    //Reconstruct game name from metadata
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

    team.other += ` te[${matchID}]:${minutes}`;
    await team.save();

    ctx.body = { updatedEndTime: newEndDate, matchID: matchID, team: team };

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
    // reset the strategy game while playing
    if (team.pageState === 'STRATEGY')
      team.pageState = 'HOME'

    //log earlier matchid
    if (team.strategyMatch.state !== 'NOT STARTED')
      team.other += ` prevstratid:${team.strategyMatch.matchID}`
    team.strategyMatch = { state: 'NOT STARTED' }
    await team.save();
    ctx.body = team;
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
    // reset the strategy game while playing
    if (team.pageState === 'RELAY')
      team.pageState = 'HOME'

    //log earlier matchid
    if (team.relayMatch.state !== 'NOT STARTED')
      team.other += ` prevrelayid:${team.relayMatch.matchID}`
    team.relayMatch = { state: 'NOT STARTED' }
    await team.save();
    ctx.body = team;
  });

  /**
   * Remove a team by teamId.
   *
   * @param {string} teamID - The ID of the team.
   */
  router.delete("/team/admin/:teamID/remove", adminAuth, async (ctx) => {
    const teamId = ctx.params.teamID;
    const deleted = await teams.removeTeam(teamId);
    if (deleted === 0) {
      ctx.throw(404, `team with teamId ${teamId} not found.`);
    }
    ctx.body = {};
  });

  /**
   * Delete every team at once. One request rather than one per team, so the
   * archive rows share a `deletedAt` — the batch a restore names.
   *
   * @returns {{ deleted: number, deletedAt: Date }}
   */
  router.delete("/team/admin/all", adminAuth, async (ctx) => {
    ctx.body = await teams.removeAllTeams();
  });

  /**
   * The archive: every deleted team, newest deletion first.
   *
   * @returns {DeletedTeamModel[]}
   */
  router.get("/team/admin/deleted", adminAuth, async (ctx) => {
    ctx.body = await teams.listDeletedTeams();
  });

  /**
   * Restore one archived team, page state and matches included.
   *
   * @param {number} deletionId - The archive row.
   * @returns {TeamModel} - The team, live again. 404 for an unknown row; 409
   *   when a live team holds its id, join code or name, saying which.
   */
  router.post("/team/admin/deleted/:deletionId/restore", adminAuth, async (ctx) => {
    const deletionId = Number(ctx.params.deletionId);
    if (!Number.isInteger(deletionId)) {
      ctx.throw(400, `Expected an integer deletionId, got ${ctx.params.deletionId}.`);
    }
    const team = await teams.restoreTeam(deletionId).catch((error: unknown) => {
      if (error instanceof UniqueConstraintError) {
        ctx.throw(409, error.errors.map(item => item.message).join(" "));
      }
      throw error;
    });
    ctx.body = team ?? ctx.throw(404, `Deleted team ${deletionId} not found.`);
  });

  /**
   * Restore a whole batch: the archive rows sharing a `deletedAt`.
   *
   * @param {string} deletedAt - The batch, as `{ "deletedAt": <ISO 8601> }`,
   *   the value `GET /team/admin/deleted` served.
   * @returns {RestoreResult} - Team names restored, and team names a live team
   *   blocked.
   */
  router.post("/team/admin/deleted/restore", adminAuth, koaBody(), async (ctx) => {
    const sent: unknown = (ctx.request.body as { deletedAt?: unknown } | undefined)?.deletedAt;
    const deletedAt = new Date(typeof sent === "string" ? sent : NaN);
    if (Number.isNaN(deletedAt.getTime())) {
      ctx.throw(400, "Expected { deletedAt: ISO 8601 string }.");
    }
    ctx.body = await teams.restoreBatch(deletedAt);
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
    //TODO: fix the return type value
    ctx.body = await teams.fetch(filters);
  });

  /**
   * Get all teams as a full object
   * @returns {TeamModel[]} - List of the selected teams
   */
  router.get("/team/admin/all", adminAuth, koaBody(), async (ctx) => {
    ctx.body = await teams.listTeams();
  })

  /**
   * Load a TSV of teams: the whole file or none of it.
   *
   * The file is the body, not a multipart upload. It was an upload until the
   * body carried join codes — team login secrets — into the OS temp directory,
   * where formidable named the file and nothing ever unlinked it. A body is
   * read into memory and gone with the request, and it is also the only shape
   * a paste into the admin page can take.
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

    ctx.body = await importTeamsFromTsv(teams, content, { dryRun });
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
   * The logged-in team's own state. This is where a match whose time ran out
   * while the team was away gets closed.
   *
   * @returns {PublicTeamView} - the team's own state, without its secrets
   */
  router.get<TeamState>("/team/me", requireTeam(teams), async (ctx) => {
    let team = ctx.state.team;
    const staleInfo = await checkStaleMatch(team);
    if (staleInfo.isStale) {
      console.log(`Stale found: ${JSON.stringify(staleInfo)}`);
      await closeMatch(
        (team[staleInfo.gameState] as InProgressMatchStatus).matchID,
        teams,
        ctx.db
      );
      team =
        (await teams.getTeam({ teamId: team.teamId })) ??
        ctx.throw(404, `Team with {teamId:${team.teamId}} not found.`);
    }
    ctx.body = publicTeamView(team);
  });

  /**
   * Let the logged-in team start a RELAY match.
   */
  router.post<TeamState>("/team/me/relay/play", requireTeam(teams), async (ctx) => {
    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, "RELAY", ctx.state.team);

    // about to start a game
    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    //created new game, updated team state accordingly
    const match = await startMatchStatus(body.matchID, ctx);
    if (match.startAt === null || match.endAt === null) {
      console.error(`GAME [${game.name}] initialiser doesn't initialise the timer!!!`)
    }
    await team.update({
      pageState: "RELAY",
      relayMatch: match,
    });
    ctx.body = body;
  });

  /**
   * Let the logged-in team start a STRATEGY match.
   */
  router.post<TeamState>("/team/me/strategy/play", requireTeam(teams), async (ctx) => {
    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, "STRATEGY", ctx.state.team);
    //about to start

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: PlayerIDType.GUESSER_PLAYER, name: team.teamId, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID);

    //created new game, updated team state accordingly
    await team.update({
      pageState: "STRATEGY",
      strategyMatch: await startMatchStatus(body.matchID, ctx),
    });
    ctx.body = body;
  });

  /**
   * Let the logged-in team set their PageState to HOME
   */
  router.post<TeamState>("/team/me/gohome", requireTeam(teams), async (ctx) => {
    const team = ctx.state.team;
    if (team.relayMatch.state === 'IN PROGRESS' || team.strategyMatch.state === 'IN PROGRESS')
      ctx.throw(403, "Not allowed, match in progress.")

    //update team state to go home
    await team.update({
      pageState: "HOME",
    });
    ctx.body = publicTeamView(team);
  });

  /**
   * Create a new BGio game
   *
   * @param {string} nameid - game ID to create
   *
   * This should be in line with boardgame.io/src/server/api.ts
   */
  router.post("/games/:nameid/create", async (ctx, next) => {
    await next();
    //Figured out where match id is stored
    console.log(`Injecting bot in :${ctx.response.body.matchID}`);
    await injectBot(ctx.db, ctx.response.body.matchID);
  });
}
