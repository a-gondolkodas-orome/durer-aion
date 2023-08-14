import koaBody from 'koa-body';
import * as Router from '@koa/router';
import type { Game, LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { InProgressMatchStatus, TeamModel } from './entities/model';
import { BOT_ID } from '../socketio_botmoves';
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
  router.get('/match/admin/:matchId/logs', async (ctx) => {
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
  router.get('/match/admin/:matchId/state', async (ctx) => {
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
   * Get metadata about a specific match.
   *
   * @param {string} matchId - The ID of the match.
   * @returns {Server.MatchData} - A match object.
   */
     router.get('/match/admin/:matchId/metadata', async (ctx) => {
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
   * Run a user defined filter query on teams
   * 
   * @param {string|string[]} filter - Get parameter to pass the filter
   * @returns {TeamModel[]} - List of the selected teams 
   */
  router.get('/team/admin/filter', koaBody(), async (ctx) => {
    const filter_string:string|string[]|undefined = ctx.request.query['filter'];
    let filters:string[];
    if (filter_string === undefined) {
      filters = []
    } else if (typeof(filter_string) === 'string' ) {
      filters = filter_string.split(',');
    }
    else{
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
  router.get('/team/admin/all',koaBody(),async (ctx) => {
    ctx.body = await teams.listTeams();
  })

  /**
   * Set the team peremeters
   * @param {string} GUID- Team DUID
   */
  router.post('/team/admin/:GUID', koaBody(),async (ctx) => {
    const GUID = ctx.params.GUID ?? ctx.throw(400)
    console.log(GUID);
    let team = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {teamId:${GUID}} not found.`)
    const requestBody = ctx.request.body
    let updateParams:{[key:string]:any} = {}
    // Whitelist the properties based on the model's attributes
    const allowedAttributes = Object.keys(TeamModel.prototype)

    for (const key of allowedAttributes) {
      if (requestBody[key] !== undefined) {
        updateParams[key] = requestBody[key]
      }
      else{
        console.log(`Dropped request param '${key}' because it's not a valid property of TeamModell.`)
      }
    }
    team.update(updateParams)
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
    if (team == null)
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
    console.log(GUID);
    let team = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {teamId:${GUID}} not found.`)
    const staleInfo = await checkStaleMatch(team);
    if (staleInfo.isStale){
      console.log(`Stale found: ${JSON.stringify(staleInfo)}`)
      await closeMatch((team[staleInfo.gameState!] as InProgressMatchStatus).matchID, teams, ctx.db);
      team = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {teamId:${GUID}} not found.`)
      console.log(JSON.stringify(team))
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
    await injectPlayer(ctx.db, body.matchID, {playerID: '0', name: GUID, credentials: team.credentials});
    await injectBot(ctx.db, body.matchID, BOT_ID);

    //created new game, updated team state accordingly
    const match = await startMatchStatus(body.matchID, ctx);
    if(match.startAt === null  || match.endAt === null){
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
    await injectPlayer(ctx.db, body.matchID, {playerID: '0', name: GUID, credentials: team.credentials});
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
    if (team.relayMatch.state == 'IN PROGRESS' || team.strategyMatch.state == 'IN PROGRESS')
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

