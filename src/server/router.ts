import koaBody from 'koa-body';
import * as Router from '@koa/router';
import type { Game, LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { InProgressMatchStatus, TeamModel } from './entities/model';
import { BOT_ID, TransportAPI } from '../socketio_botmoves';
import { getFilterPlayerView } from "boardgame.io/internal";
import { closeMatch, getNewGame, checkStaleMatch, startMatchStatus, createGame, injectBot, injectPlayer } from './team_manage';


/**
 * 
 * Big factory to set up the Router for the API, anso contains API function implementations.
 * 
 * @param router - Koa Router
 * @param teams - List of teams, provided as a TeamsRepository
 * @param games - List of possible games for teams
 */
export function configureTeamsRouter(router: Router<any, Server.AppCtx>, teams: TeamsRepository, games: Game<any, Record<string, unknown>, any>[]) {

  /**
   * Get the log data about a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {LogEntry[]} - A list of log objects.
   */
  router.get('/game/admin/:matchId/logs', async (ctx) => {
    //It is already authenticated by the admin mount routing
    const matchID = ctx.params.matchId;
    const { log } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      log: true,
    });
    if (!log) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
    }
    ctx.body = log;
  });

  /**
   * Get the state data of a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {State<any>} - A match state object object.
   */
  router.get('/game/admin/:matchId/state', async (ctx) => {
    const matchID = ctx.params.matchId;
    const { state } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      state: true,
    });
    if (!state) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
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
  router.get('/game/admin/:matchId/addminutes/:minutes', async (ctx) => {
    const matchID = ctx.params.matchId;
    const minutes = Number(ctx.params.minutes);
    const { state, metadata } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      state: true,
      metadata: true
    });
    if (!state) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
    }
    // Fetch team
    const teamId = metadata.players[0].name;
    const team = await teams.getTeam({ teamId })

    if (!team) {
      ctx.throw(500, `Match found, but assigned team ${teamId} was not found.`);
      return
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
    new_state.G.milisecondsRemaining = newEndDate.getTime() - new Date().getTime();

    //Update team
    if (team.strategyMatch.state === "IN PROGRESS") {
      if (team.strategyMatch.matchID !== matchID) {
        ctx.throw(501, `IN PROGRESS strategy match found (${team.strategyMatch.matchID}), but it does not match with matchID (${matchID}). (Probabaly you are using an old matchID.)`);
      }
      await team.update({
        strategyMatch: {
          state: 'IN PROGRESS',
          matchID: matchID,
          startAt: new Date(new_state.G.start),
          endAt: newEndDate,
        }
      })
    }
    else if (team.relayMatch.state === "IN PROGRESS") {
      if (team.relayMatch.matchID !== matchID) {
        ctx.throw(501, `IN PROGRESS relay match found (${team.relayMatch.matchID}), but it does not match with matchID (${matchID}). (Probabaly you are using an old matchID.)`);
      }
      await team.update({
        relayMatch: {
          state: 'IN PROGRESS',
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
    let game = games.find(g => g.name === metadata.gameName);
    if (!game) {
      ctx.throw(404, `Match found, but game ${metadata.gameName} was not found.`);
      return
    }

    /* Hijacking the internal transport API used ot send backend updates to the frontend to send an update to the frontend
    This is a bit hacky, but it mainly simulates a similar effect as what would happen if a different user changes teh gamestate irl
    This is generally equal to what would happen if multiple players play the game, and one does some actions.
    The other players would see the updated gamestate, and the frontend would update accordingly.
    The normal way to use this, is to create a Master authorative object, which handels validations, and other logics.
    Here we already handeled the validation, and uploded it to the database, so we can just send the updated gamestate to the frontend.
    This is possible, because the publish functionality of the PubSub implementation,if we use a SendAll function, can be reconstructed easily from the transport layer we defined from the botmoves already. */
    const my_transportAPI = TransportAPI(matchID, null /* we are only using sendAll */, getFilterPlayerView(game), ctx.durer_transport.pubSub)

    my_transportAPI.sendAll(
      {
        type: 'update',
        args: [matchID, new_state]
      }
    )

    team.other += ` te[${matchID}]:${minutes}`
    team.save()

    ctx.body = { updatedEndTime: newEndDate, matchID: matchID, team: team };

  });

  /**
   * Get metadata about a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {Server.MatchData} - A match object.
   */
  router.get('/game/admin/:matchId/metadata', async (ctx) => {
    const matchID = ctx.params.matchId;
    const { metadata } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      metadata: true,
    });
    if (!metadata) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
    }
    ctx.body = metadata;
  });

  /**
     * Reset teams's strategy
     *
     * @param {string} teamID - The ID of the team.
     * @returns {TeamModel} - Returns the modified team model.
     */
  router.get('/team/admin/:teamID/reset/strategy', async (ctx) => {
    const teamId = ctx.params.teamID;
    const team = await teams.getTeam({ teamId })

    if (!team) {
      ctx.throw(404, `Team not found with teamID ${teamId}.`);
      return
    }
    // reset the strategy game while playing
    if (team.pageState === 'STRATEGY')
      team.pageState = 'HOME'

    //log earlier matchid
    if (team.strategyMatch.state !== 'NOT STARTED')
      team.other += ` prevstratid:${team.strategyMatch.matchID}`
    team.strategyMatch = { state: 'NOT STARTED' }
    team.save();
    ctx.body = team
  });

  /**
     * Reset teams's relay
     *
     * @param {string} teamID - The ID of the team.
     * @returns {TeamModel} - Returns the modified team model.
     */
  router.get('/team/admin/:teamID/reset/relay', async (ctx) => {
    const teamId = ctx.params.teamID;
    const team = await teams.getTeam({ teamId })

    if (!team) {
      ctx.throw(404, `Team not found with teamID ${teamId}.`);
      return
    }
    // reset the strategy game while playing
    if (team.pageState === 'RELAY')
      team.pageState = 'HOME'

    //log earlier matchid
    if (team.relayMatch.state !== 'NOT STARTED')
      team.other += ` prevrelayid:${team.relayMatch.matchID}`
    team.relayMatch = { state: 'NOT STARTED' }
    team.save();
    ctx.body = team
  });

  /**
   * Run a user defined filter query on teams
   * 
   * @param {string|string[]} filter - Get parameter to pass the filter
   * @returns {TeamModel[]} - List of the selected teams 
   */
  router.get('/team/admin/filter', koaBody(), async (ctx) => {
    const filter_string: string | string[] | undefined = ctx.request.query['filter'];
    let filters: string[];
    if (filter_string === undefined) {
      filters = []
    } else if (typeof (filter_string) === 'string') {
      filters = filter_string.split(',');
    }
    else {
      filters = filter_string;
    }
    //TODO: fix the return type value
    ctx.body = await teams.fetch(filters);
    //    ctx.body = ['8eae8669-125c-42e5-8b49-89afbac31679', '18c3a69d-c477-4578-8dc1-6e430fbb4e80', '48df4969-a834-4131-ab75-24069a56d2d6'];
  })

  /**
   * Get all teams as a full object
   * @returns {TeamModel[]} - List of the selected teams 
   */
  router.get('/team/admin/all', koaBody(), async (ctx) => {
    ctx.body = await teams.listTeams();
  })


  /**
   * Get team ID based on login token
   * 
   * @param {string} token: Login token
   * @returns {srting } - TeamId for the team
   */
  router.get('/team/join/:token', koaBody(), async (ctx) => {
    const connect_token: string = ctx.params.token ?? 'no-token';
    const team = await teams.getTeam({ joinCode: connect_token });
    ctx.body = team?.teamId;
    if (team === null)
      ctx.throw(404, "Team not found!")
  })

  /**
   * ROUTING FOR TEAM DATA is handled here. If wrong team then returns 400
   * This is the main middleware to catch wrong team id-s
   * 
   * @param {string} GUID - TeamId
   * @returns {TeamModel} - raw TeamModell if called directly
   * 
   */
  router.get(/^\/team\/(?<GUID>[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}$)/, koaBody(), async (ctx) => {
    const GUID = ctx.params.GUID ?? ctx.throw(400)
    console.log("team-data-access: ", GUID);
    let team = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {teamId:${GUID}} not found.`)
    const staleInfo = await checkStaleMatch(team);
    if (staleInfo.isStale) {
      console.log(`Stale found: ${JSON.stringify(staleInfo)}`)
      await closeMatch((team[staleInfo.gameState!] as InProgressMatchStatus).matchID, teams, ctx.db);
      team = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {teamId:${GUID}} not found.`)
    }
    ctx.body = team;
  });


  /**
   * Let a team strat a RELAY match.
   * 
   * @param {string} GUID - TeamId
   */
  router.get('/team/:GUID/relay/play', koaBody(), async (ctx) => {
    const GUID = ctx.params.GUID;

    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, 'RELAY');

    // about to start a game
    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: '0', name: GUID, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID, BOT_ID);

    //created new game, updated team state accordingly
    const match = await startMatchStatus(body.matchID, ctx);
    if (match.startAt === null || match.endAt === null) {
      console.error(`GAME [${game.name}] initialiser doesn't initialise the timer!!!`)
    }
    team.update({
      pageState: "RELAY",
      relayMatch: match
    })
    ctx.body = body;
  })

  /**
   * Let a team strat a STRATEGY match.
   * 
   * @param {string} GUID - TeamId
   */
  router.get('/team/:GUID/strategy/play', koaBody(), async (ctx) => {
    const GUID = ctx.params.GUID;
    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, 'STRATEGY');
    //about to start

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, { playerID: '0', name: GUID, credentials: team.credentials });
    await injectBot(ctx.db, body.matchID, BOT_ID);

    //created new game, updated team state accordingly
    team.update({
      pageState: 'STRATEGY',
      strategyMatch: await startMatchStatus(body.matchID, ctx)
    })
    ctx.body = body;
  })

  /**
   * Let a team set their PageState to HOME
   * 
   * @param {string} GUID - TeamId
   */
  router.get('/team/:GUID/gohome', koaBody(), async (ctx) => {
    const GUID = ctx.params.GUID;
    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const team: TeamModel = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)
    if (team.relayMatch.state === 'IN PROGRESS' || team.strategyMatch.state === 'IN PROGRESS')
      ctx.throw(403, "Not allowed, match in progress.")

    //update team state to go home
    team.update({
      pageState: 'HOME',
    })
    ctx.body = team;
  })

  /**
   * Let a team get their relay results
   * TODO: implement
   * 
   * @param {string} GUID - TeamId
   */
  router.get('/team/:GUID/relay/result', koaBody(), async (ctx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  /**
   * Let a team get their strategy results
   * TODO: implement
   * 
   * @param {string} GUID - TeamId
   */
  router.get('/team/:GUID/strategy/result', koaBody(), async (ctx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  /**
   * Create a new BGio game
   * 
   * @param {string} nameid - game ID to create
   * 
   * This should be in line with boardgame.io/src/server/api.ts
   */
  router.post('/games/:nameid/create', async (ctx, next) => {
    await next();
    //Figured out where match id is stored
    console.log(`Injecting bot in :${ctx.response.body.matchID}`)
    await injectBot(ctx.db, ctx.response.body.matchID, BOT_ID);
  });


}

