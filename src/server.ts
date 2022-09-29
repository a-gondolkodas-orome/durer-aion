import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { Server, SocketIO } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as TicTacToeStrategy } from './games/tictactoe/strategy';
import { strategy as SuperstitiousCountingStrategy } from './games/superstitious-counting/strategy';
import { strategy as ChessBishopsStrategy } from './games/chess-bishops/strategy';

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

const bots = games.map((game, idx) => new (bot_factories[idx])({
  enumerate: game.ai?.enumerate,
  seed: game.seed,
}));

const server = Server({
  games: games,
  transport: new SocketIO(
    { https: undefined },
    getBotCredentials(),
    bots,
  ),
  ...getDb(),
})

const PORT = parseInt(env.PORT || "8000");

server.run(PORT);
