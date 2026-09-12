import koaBody from 'koa-body';
import * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { InProgressMatchStatus } from 'schemas';
import { closeMatch, getNewGame, checkStaleMatch, startMatchStatus, createGame, injectBot, injectPlayer } from './team_manage';
import { import_teams_from_tsv } from './team_import';
import { publicTeamView } from './team_view';
import { TeamState, clearTeamCookie, requireJson, requireTeam, setTeamCookie } from './team_session';
import { JOIN_ATTEMPT_LIMIT, JOIN_ATTEMPT_WINDOW_SECONDS, rateLimit } from './rate_limit';
import type { requireAdmin } from './admin_session';
import { AnyBgioGame, PlayerIDType } from 'game';
import { appendOtherNote } from './model';
import { addMinutesToEveryRunningMatch, addMinutesToMatch, type ExtendRefusal, type MatchClock, type MatchQueue }
  from './add_minutes';
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

  /** What `add_minutes.ts` needs, taken off the request.
   *
   * `durer_transport` is the socket transport `server.ts` hangs on the koa
   * context; koa types that context with an index signature, so the shape is
   * named here rather than inferred from nothing. */
  interface DurerTransport {
    getMatchQueue: (matchID: string) => MatchQueue;
    pubSub: MatchClock['pubSub'];
  }
  const matchClock = (ctx: Server.AppCtx): MatchClock => {
    const transport = ctx.durer_transport as DurerTransport;
    return {
      db: ctx.db,
      teams,
      games,
      queueFor: matchID => transport.getMatchQueue(matchID),
      pubSub: transport.pubSub,
    };
  };

  /** A refusal as the status the admin page already knows how to read. */
  const refuse = (
    ctx: { throw: (status: number, message: string) => never },
    reason: ExtendRefusal,
    matchID: string,
  ): never => {
    switch (reason.kind) {
      case "match-not-found":
        return ctx.throw(404, `Match ${matchID} not found`);
      case "team-not-found":
        return ctx.throw(500, `Match found, but assigned team ${reason.teamId} was not found.`);
      case "other-match-running":
        return ctx.throw(501, `IN PROGRESS match found (${reason.running}), but it does not match with matchID (${matchID}). (Probably you are using an old matchID.)`);
      case "no-match-running":
        return ctx.throw(501, 'Restarting an already finished match is not supported right now.');
      case "game-not-found":
        return ctx.throw(404, `Match found, but game ${reason.gameName} was not found.`);
    }
  };

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
 * Add extra time to a specific match.
 *
 * @param {string} matchId - The ID of the match.
 * @param {integer} minutes - How many minutes to add
 * @returns {{updatedEndTime: Date, matchID: string, team: TeamModel}}
 */
  router.post("/game/admin/:matchId/addminutes/:minutes", adminAuth, async (ctx) => {
    const matchID = ctx.params.matchId;
    const result = await addMinutesToMatch(matchClock(ctx), { matchID, minutes: Number(ctx.params.minutes) });
    if (result.status === "refused") refuse(ctx, result.reason, matchID);
    else ctx.body = { updatedEndTime: result.endAt, matchID: result.matchID, team: result.team };
  });

  /**
   * Give every running match more time, under one grant.
   *
   * The grant is the caller's, and is what makes asking twice safe: a match
   * already carrying it is reported as `alreadyGranted` and not moved again.
   * That is the case a long walk needs — the browser giving up on a request the
   * server went on to finish — so the same grant must be sent on a retry, and a
   * new one only when the organiser means a second extension.
   *
   * @param {{minutes: number, grant: string}} body
   * @returns {BulkExtendResult} - team names extended, already granted, and the
   *   ones with a problem, each with why.
   */
  router.post("/game/admin/addminutes", adminAuth, koaBody(), async (ctx) => {
    const body = ctx.request.body as { minutes?: unknown; grant?: unknown } | undefined;
    const minutes = Number(body?.minutes);
    // Rejected here rather than reaching `setMinutes`, where a non-number
    // becomes an Invalid Date and throws on the way out of `toISOString`.
    if (!Number.isInteger(minutes)) {
      ctx.throw(400, "Expected { minutes: integer, grant: string }.");
    }
    const sent: unknown = body?.grant;
    const grant = typeof sent === "string" && sent !== ""
      ? sent
      : ctx.throw(400, "Expected { minutes: integer, grant: string }.");

    ctx.body = await addMinutesToEveryRunningMatch(matchClock(ctx), { minutes, grant });
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
      team.other = appendOtherNote(team.other, `prevstratid:${team.strategyMatch.matchID}`)
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
      team.other = appendOtherNote(team.other, `prevrelayid:${team.relayMatch.matchID}`)
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
 * Get all teams as a full object
 * @returns {TeamModel[]} - List of the selected teams
 */
  router.put("/team/admin/import", adminAuth, koaBody({ multipart: true }), async (ctx) => {
    const { file } = ctx.request.files ?? ctx.throw(400, 'No files uploaded!');
    // Check if multiple files are uploaded
    if (Array.isArray(file)) {
      ctx.throw(400, 'Multiple files are not supported.');
      return;
    }

    // Check if the file is a TSV file
    if (!file || !file.filepath?.endsWith('.tsv')) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid file format. Only TSV files are allowed.' };
      return;
    }

    const import_results = await import_teams_from_tsv(teams, file.filepath)

    ctx.body = import_results;
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
