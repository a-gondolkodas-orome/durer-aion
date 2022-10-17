import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { BOT_ID, fetch, SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as TicTacToeStrategy } from './games/tictactoe/strategy';
import { strategy as SuperstitiousCountingStrategy } from './games/superstitious-counting/strategy';
import { strategy as ChessBishopsStrategy } from './games/chess-bishops/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';
import { importer } from './server/team_import';
import { StorageAPI } from 'boardgame.io';

import auth from 'koa-basic-auth';
import mount from 'koa-mount';


function getDb() {
  if (env.DATABASE_URL) {
    const CONNECTION_STRING = env.DATABASE_URL;
    const db = new PostgresStore(CONNECTION_STRING);
    return {
      db,
      teams: new TeamsRepository(db),
    }
  } else {
    throw 'Failed to load DB data. Only postgres is supported!';
  }
}

export function getBotCredentials() {
  if (!env.BOT_CREDENTIALS) {
    throw 'No BOT_CREDENTIALS supplied! Do set it in the environment';
  }
  return env.BOT_CREDENTIALS;
}

getBotCredentials(); // give love if no creds are supplied

export function getAdminCredentials() {
  if (!env.ADMIN_CREDENTIALS) {
    throw 'No ADMIN_CREDENTIALS supplied! Do set it in the environment';
  }
  return env.ADMIN_CREDENTIALS;
}

getAdminCredentials(); // give love if no creds are supplied

const games = [
  gameWrapper(TicTacToeGame),
  gameWrapper(SuperstitiousCountingGame),
  gameWrapper(ChessBishopsGame),
];

const bot_factories : any = [
  botWrapper(TicTacToeStrategy),
  botWrapper(SuperstitiousCountingStrategy),
  botWrapper(ChessBishopsStrategy),
];

let { db, teams } = getDb();

// node: argv[0] vs server.ts: argv[1]
if (argv[2] == "import") {
  const filename = argv[3];
  importer(teams, filename).then(() => exit(0));
} else {
  const bots = games.map((game, idx) => new (bot_factories[idx])({
    enumerate: game.ai?.enumerate,
    seed: game.seed,
  }));
  
  const server = Server({
    games: games,
    transport: new SocketIOButBotMoves(
      { https: undefined },
      { "tic-tac-toe": bots[0], "superstitious-counting": bots[1], "chess-bishops": bots[2] },
    ),
    db,
  });

  const PORT = parseInt(env.PORT || "8000");

  /** Joins a bot to a match where the bot's side is not connected.
   * @param db: Database context
   * @param matchID: match id to connect a bot to
   * 
   * This should be in line with boardgame.io/src/server/api.ts
   * path would be '/games/:name/:id/join'.
   */
  const injectBot = async (db: StorageAPI.Async | StorageAPI.Sync,matchId:string) =>{
      let match = await fetch(db, matchId, {metadata: true});
      if (!match.metadata.players[BOT_ID].isConnected) {
        console.log(`Match is indeed empty, and thus in need for a bot!`);
        match.metadata.players[BOT_ID].name = 'Bot';
        match.metadata.players[BOT_ID].credentials = getBotCredentials();
        match.metadata.players[BOT_ID].isConnected = true;
        await db.setMetadata(matchId, match.metadata);
      }
  }

  /** This should be in line with boardgame.io/src/server/api.ts */
  server.router.post('/games/:nameid/create', async (ctx, next) => {
    await next();
    //Figured out where match id is stored
    console.log(`Injecting bot in :${ctx.response.body.matchID}`)
    await injectBot(ctx.db,ctx.response.body.matchID);
  });

  server.app.use(mount('/team/admin',auth({name:'admin',pass:getAdminCredentials()})));
  
  //TODO regex mount protection for Boardgame.io endpoints

  configureTeamsRouter(server.router, teams);
  server.run(PORT);
}