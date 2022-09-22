import { Server } from 'boardgame.io/server';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { BOT_ID, fetch, SocketIOButBotMoves } from './socketio_botmoves';

function getDb() {
  if (env.DATABASE_URL) {
    const CONNECTION_STRING = env.DATABASE_URL;
    return {
      db: new PostgresStore(CONNECTION_STRING),
    }
  } else {
    return {};
  }
}

export function getBotCredentials() {
  return env.BOT_CREDENTIALS || "botbotbot";
}

const server = Server({
  games: [
    gameWrapper(TicTacToeGame),
    gameWrapper(SuperstitiousCountingGame),
    gameWrapper(ChessBishopsGame),
  ],
  transport: new SocketIOButBotMoves({ https: undefined }),
  ...getDb(),
})

const PORT = parseInt(env.PORT || "8000");

/** Joins a bot to all matches where the bot's side is not connected.
 * 
 * TODO inject bots only where it is needed.
 * 
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
async function injectBots(db: any) {
  console.log("Injecting listing matches!");
  for (let matchID of await db.listMatches()) {
    console.log(`Found match ${matchID}`);
    var match = await fetch(db, matchID, {metadata: true});
    // TODO do not connect a bot to ALL unconnected
    // TODO broken
    if (match === undefined) {
      return;
    }
    if (!match.metadata.players[BOT_ID].isConnected) {
      console.log(`Found empty match!`);
      match.metadata.players[BOT_ID].name = 'Bot';
      match.metadata.players[BOT_ID].credentials = getBotCredentials();
      match.metadata.players[BOT_ID].isConnected = true;
      await db.setMetadata(matchID, match.metadata);
    }
  }
}

/** This should be in line with boardgame.io/src/server/api.ts */
server.router.post('/games/:nameid/create', async (ctx, next) => {
  // TODO somehow figure out the MatchID of the created match
  await next();
  await injectBots(ctx.db);
});

server.run(PORT);
