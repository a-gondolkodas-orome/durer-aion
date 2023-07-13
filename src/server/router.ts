import type Router from '@koa/router';
import koaBody from 'koa-body';
import type { Game, LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { createMatch } from 'boardgame.io/internal';
import { nanoid } from 'nanoid';
import { InProgressMatchStatus } from './entities/model';
import { BOT_ID, fetch } from '../socketio_botmoves';
import { getBotCredentials, getGameStartAndEndTime } from '../server';
import { closeMatch, getNewGame, checkStaleMatch, startMatchStatus } from './team_manage';

/** Joins a player to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 * 
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
const injectPlayer = async (db: StorageAPI.Async | StorageAPI.Sync, matchId: string, {
  playerID,
  name,
  credentials
}:{
  playerID: any, //TODO: fix to correct type
  name: string,
  credentials: string,
}
) => {
  let match = await fetch(db, matchId, { metadata: true });
  console.log(`Match is indeed empty, and thus in need for a bot!`);
  match.metadata.players[playerID].name = name;
  match.metadata.players[playerID].credentials = credentials;
  match.metadata.players[playerID].isConnected = true;
  await db.setMetadata(matchId, match.metadata);
}

/** Joins a bot to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 * 
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
 const injectBot = async (db: StorageAPI.Async | StorageAPI.Sync, matchId: string) => {
  await injectPlayer(db, matchId, {
    playerID: BOT_ID,
    name: 'Bot',
    credentials: getBotCredentials()
  });
}

//TODO: check if export is needed
function checkGlobalTime():"WAITING"|"FINISHED"|undefined{
  const now = new Date()
  const {globalStartAt,globalEndAt} = getGameStartAndEndTime();

  if(now.getTime() < globalStartAt.getTime()){
    return "WAITING"
  }
  if(globalEndAt.getTime() < now.getTime()){
    return "FINISHED"
  }
  return undefined
}

async function createGame(
  game: Game<any, Record<string, unknown>, any>,
  ctx: Server.AppCtx
) {
  const matchID: string = nanoid(11);
  const match = createMatch({ game: game!, numPlayers: 2, setupData: undefined, unlisted: false });

  if ('setupDataError' in match) {
    ctx.throw(400, match.setupDataError);
  } else {
    await ctx.db.createMatch(matchID, match);
  }

  const body: LobbyAPI.CreatedMatch = { matchID };
  return body;
};

export function configureTeamsRouter(router: Router<any, Server.AppCtx>, teams: TeamsRepository, games: Game<any, Record<string, unknown>, any>[]) {
  /**
   * Get data about a specific match.
   *
   * @param {string} name - The name of the game.
   * @param {string} id - The ID of the match.
   * @return - A match object.
   */
  router.get('/team/admin/:id/logs', async (ctx) => {
    //It is already authenticated by the admin mount routing
    const matchID = ctx.params.id;
    const { log } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      log: true,
    });
    if (!log) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
    }
    ctx.body = log;
  });

  /**
   * Get data about a specific match.
   *
   * @param {string} name - The name of the game.
   * @param {string} id - The ID of the match.
   * @return - A match object.
   */
  router.get('/team/admin/:id/state', async (ctx) => {
    const matchID = ctx.params.id;
    const { state } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
      state: true,
    });
    if (!state) {
      ctx.throw(404, 'Match ' + matchID + ' not found');
    }
    ctx.body = state;
  });

    /**
   * Get data about a specific match.
   *
   * @param {string} name - The name of the game.
   * @param {string} id - The ID of the match.
   * @return - A match object.
   */
     router.get('/team/admin/:id/metadata', async (ctx) => {
      const matchID = ctx.params.id;
      const { metadata } = await (ctx.db as StorageAPI.Async).fetch(matchID, {
        metadata: true,
      });
      if (!metadata) {
        ctx.throw(404, 'Match ' + matchID + ' not found');
      }
      ctx.body = metadata;
    });

  router.get('/team/admin/filter', koaBody(), async (ctx: Server.AppCtx) => {
    const filter_string = ctx.request.query['filter'];
    let filters;
    if (filter_string === undefined) {
      filters = [];
    } else {
      filters = filter_string.split(',');
    }
    ctx.body = await teams.fetch(filters);
    //    ctx.body = ['8eae8669-125c-42e5-8b49-89afbac31679', '18c3a69d-c477-4578-8dc1-6e430fbb4e80', '48df4969-a834-4131-ab75-24069a56d2d6'];
  })

  router.get('/team/join/:token', koaBody(), async (ctx: Server.AppCtx) => {
    const connect_token: string = ctx.params.token ?? 'no-token';
    const team = await teams.getTeam({ joinCode: connect_token });
    ctx.body = team?.id;
    if (team == null)
      ctx.throw(404, "Team not found!")
  })

  //ROUTING FOR TEAM DATA
  router.get(/^\/team\/(?<GUID>[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}$)/, koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID ?? ctx.throw(400)
    console.log(GUID);
    const team = await teams.getTeam({ id: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)
    const staleInfo = await checkStaleMatch(team);
    if (staleInfo.isStale){
      console.log(`Stale found: ${staleInfo}`)
      closeMatch((team[staleInfo.gameState!] as InProgressMatchStatus).matchID, teams, ctx.db);
    }
    ctx.body = team;
  });



  router.get('/team/:GUID/relay/play', koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID;
      //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, 'RELAY');


    // about to start a game

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, {playerID: '0', name: GUID, credentials: team.credentials});
    await injectBot(ctx.db, body.matchID);

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

  router.get('/team/:GUID/strategy/play', koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID;
    //check if in progress, it is not allowed to play
    //check if it can be started, throw error if not
    const { game, team } = await getNewGame(ctx, teams, games, 'STRATEGY');
    //about to start

    const body: LobbyAPI.CreatedMatch = await createGame(game, ctx);
    await injectPlayer(ctx.db, body.matchID, {playerID: '0', name: GUID, credentials: team.credentials});
    await injectBot(ctx.db, body.matchID);

    //created new game, updated team state accordingly
    team.update({
      pageState: 'STRATEGY',
      strategyMatch: await startMatchStatus(body.matchID, ctx)
    })
    ctx.body = body;
  })

  router.get('/team/:GUID/relay/result', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  router.get('/team/:GUID/strategy/result', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  /** This should be in line with boardgame.io/src/server/api.ts */
  router.post('/games/:nameid/create', async (ctx, next) => {
    await next();
    //Figured out where match id is stored
    console.log(`Injecting bot in :${ctx.response.body.matchID}`)
    await injectBot(ctx.db, ctx.response.body.matchID);
  });


}

