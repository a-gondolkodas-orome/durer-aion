import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { Server, SocketIO } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as TicTacToeStrategy } from './games/tictactoe/strategy';
import { strategy as SuperstitiousCountingStrategy } from './games/superstitious-counting/strategy';
import { strategy as ChessBishopsStrategy } from './games/chess-bishops/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';

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

let { db, teams } = getDb();

const server = Server({
  games: games,
  transport: new SocketIO(
    { https: undefined },
    getBotCredentials(),
    bots,
  ),
  db,
});

const PORT = parseInt(env.PORT || "8000");

configureTeamsRouter(server.router, teams);
server.run(PORT);
