import type Router from '@koa/router';
import koaBody from 'koa-body';
import type { Game, LobbyAPI, Server, StorageAPI } from 'boardgame.io';
import { TeamsRepository } from './db';
import { createMatch } from 'boardgame.io/internal';
import { nanoid } from 'nanoid';
import { MatchStatus, TeamModel } from './entities/model';
import { BOT_ID,fetch } from '../socketio_botmoves';
import { getBotCredentials } from '../server';

/** Joins a bot to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 * 
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
const injectBot = async (db: StorageAPI.Async | StorageAPI.Sync, matchId: string) => {
  let match = await fetch(db, matchId, { metadata: true });
  if (!match.metadata.players[BOT_ID].isConnected) {
    console.log(`Match is indeed empty, and thus in need for a bot!`);
    match.metadata.players[BOT_ID].name = 'Bot';
    match.metadata.players[BOT_ID].credentials = getBotCredentials();
    match.metadata.players[BOT_ID].isConnected = true;
    await db.setMetadata(matchId, match.metadata);
  }
}


async function startGame(
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

  router.get(/^\/team\/(?<GUID>[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}$)/, koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID ?? ctx.throw(400)
    console.log(GUID);
    const team = await teams.getTeam({ id: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)
    ctx.body = team;
  });

  router.get('/team/:GUID/relay/play', koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID;
    const team:TeamModel = await teams.getTeam({ id: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)

    console.log(team.category)
    //TODO remove hardcoded value
    const gameName = 'tic-tac-toe';
    const game = games.find((g) => g.name === gameName);
    if (!game) ctx.throw(404, 'Game ' + gameName + ' not found');

    const body = await startGame(game!, ctx);
    await injectBot(ctx.db, body.matchID);


    //TODO update teamState,gameState
    team.update({
      pageState:"RELAY",
    })
    ctx.body = body;
  })

  router.get('/team/:GUID/strategy/play', koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID;
    const team:TeamModel = await teams.getTeam({ id: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)

    console.log(team.category)
    //TODO remove hardcoded value
    const gameName = 'tic-tac-toe';
    const game = games.find((g) => g.name === gameName);
    if (!game) ctx.throw(404, 'Game ' + gameName + ' not found');

    const body = await startGame(game!, ctx);
    await injectBot(ctx.db, body.matchID);


    //TODO update teamState,gameState
    team.update({
      pageState:"RELAY",
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
    await injectBot(ctx.db,ctx.response.body.matchID);
  });


}

