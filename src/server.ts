import { Server } from 'boardgame.io/server';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';

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


const server = Server({
  games: [
    TicTacToeGame,
    SuperstitiousCountingGame,
    ChessBishopsGame,
  ],
  ...getDb(),
})

const PORT = parseInt(env.PORT || "8000");
server.run(PORT);
