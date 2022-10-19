import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { GameRelay } from './games/relay/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { MyGame as TenCoinsGame } from './games/ten-coins/game';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as TicTacToeStrategy } from './games/tictactoe/strategy';
import { strategy as RelayStrategy } from './games/relay/strategy';
import { strategy as SuperstitiousCountingStrategy } from './games/superstitious-counting/strategy';
import { strategy as ChessBishopsStrategy } from './games/chess-bishops/strategy';
import { strategyWrapper as TenCoinsStrategy } from './games/ten-coins/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';
import { importer } from './server/team_import';

import auth from 'koa-basic-auth';
import mount from 'koa-mount';
import { closeMatch } from './server/team_manage';


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
  {...GameRelay, name: "relay_c"},
  {...GameRelay, name: "relay_d"},
  {...GameRelay, name: "relay_e"},
  {...gameWrapper(TenCoinsGame), name: "tencoins_c"},
  {...gameWrapper(TenCoinsGame), name: "tencoins_d"},
  {...gameWrapper(TenCoinsGame), name: "tencoins_e"},
];

export const relayNames = {
  C:'relay_c',
  D:'relay_d',
  E:'relay_e',
}

export const strategyNames = {
  C:'tic-tac-toe',
  D:'superstitious-counting',
  E:'chess-bishops',
}

const bot_factories : any = [
  botWrapper(TicTacToeStrategy),
  botWrapper(SuperstitiousCountingStrategy),
  botWrapper(ChessBishopsStrategy),
  botWrapper(RelayStrategy("C")),
  botWrapper(RelayStrategy("D")),
  botWrapper(RelayStrategy("E")),
  botWrapper(TenCoinsStrategy("C")),
  botWrapper(TenCoinsStrategy("D")),
  botWrapper(TenCoinsStrategy("E")),
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
      { "tic-tac-toe": bots[0], "superstitious-counting": bots[1], "chess-bishops": bots[2], "relay_c": bots[3], "relay_d": bots[4], "relay_e": bots[5], "tencoins_c": bots[6], "tencoins_d": bots[7], "tencoins_e": bots[8] },
      function onFinishedMatch(matchID) {
        closeMatch(matchID,teams,db);
      }
    ),
    db,
  });

  const PORT = parseInt(env.PORT || "8000");

  //Admin page auth setup
  server.app.use(mount('/team/admin',auth({name:'admin',pass:getAdminCredentials()})));

  //TODO regex mount protection for Boardgame.io endpoints
  
  configureTeamsRouter(server.router, teams,games);
  server.run(PORT);
}