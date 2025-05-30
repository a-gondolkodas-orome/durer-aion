import { GameRelay } from './games/relay/game';
import { myGameWrapper as strategyGameWrapper } from './games/remove-from-circle/game';
import { strategyWrapper as StrategyStrategyremovefromcirclee } from './games/remove-from-circle/strategy';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as RelayStrategy } from './games/relay/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';
import { import_teams_from_tsv_locally } from './server/team_import';

import auth from 'koa-basic-auth';
import mount from 'koa-mount';
import { closeMatch } from './server/team_manage';

import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function getDb() {
  if (env.DATABASE_URL) {
    const CONNECTION_STRING = env.DATABASE_URL;
    const db = new PostgresStore(CONNECTION_STRING, { logging: false });
    return {
      db,
      teams: new TeamsRepository(db),
    }
  } else {
    throw new Error('Failed to load DB data. Only postgres is supported!');
  }
}

export function getBotCredentials() {
  if (!env.BOT_CREDENTIALS) {
    throw new Error('No BOT_CREDENTIALS supplied! Do set it in the environment');
  }
  return env.BOT_CREDENTIALS;
}

export function getAdminCredentials() {
  if (!env.ADMIN_CREDENTIALS) {
    throw new Error('No ADMIN_CREDENTIALS supplied! Do set it in the environment');
  }
  return env.ADMIN_CREDENTIALS;
}



export function getGameStartAndEndTime() {
  if (!env.GAME_GLOBAL_START_T) {
    throw new Error('No GAME_GLOBAL_START_T supplied! Do set it in the environment');
  }
  if (!env.GAME_GLOBAL_END_T) {
    throw new Error('No GAME_GLOBAL_END_T supplied! Do set it in the environment');
  }
  return {
    globalStartAt: new Date(env.GAME_GLOBAL_START_T),
    globalEndAt: new Date(env.GAME_GLOBAL_END_T),
  };
}


export const relayNames = {
  C: 'relay_c',
  D: 'relay_d',
  E: 'relay_e',
}

export const strategyNames = {
  C: 'remove-from-circle_c',
  D: 'remove-from-circle_d',
  E: 'remove-from-circle_e',
}

const games = [
  { ...GameRelay, name: relayNames.C },
  { ...GameRelay, name: relayNames.D },
  { ...GameRelay, name: relayNames.E },
  { ...gameWrapper(strategyGameWrapper("C")), name: strategyNames.C },
  { ...gameWrapper(strategyGameWrapper("D")), name: strategyNames.D },
  { ...gameWrapper(strategyGameWrapper("E")), name: strategyNames.E },
];


const bot_factories = [
  botWrapper(RelayStrategy("C")),
  botWrapper(RelayStrategy("D")),
  botWrapper(RelayStrategy("E")),
  botWrapper(StrategyStrategyremovefromcirclee("C")),
  botWrapper(StrategyStrategyremovefromcirclee("D")),
  botWrapper(StrategyStrategyremovefromcirclee("E")),
];

if (argv[2] === "sanity-check") {
  console.log("OK");
  exit(0);
}

getBotCredentials(); // give love if no creds are supplied
getAdminCredentials(); // give love if no creds are supplied
getGameStartAndEndTime(); // give love if no creds are supplied

let { db, teams } = getDb();

// node: argv[0] vs server.ts: argv[1]
if (argv[2] === "import") {
  const filename = argv[3];
  import_teams_from_tsv_locally(teams, filename).then(() => exit(0));
} else {
  const botSetup = Object.fromEntries(
    games.map((game, idx) =>
      [game.name,
      new (bot_factories[idx])({
        enumerate: game.ai?.enumerate,
        seed: game.seed,
      })]
    ));

  const socketio = new SocketIOButBotMoves(
    { https: undefined },
    botSetup,
    async function onFinishedMatch(matchID) {
      await closeMatch(matchID, teams, db);
    },
  );
  const server = Server({
    games: games,
    transport: socketio,
    db,
  });

  const PORT = parseInt(env.PORT || "8000");

  // Set up transport layer for updates
  server.app.context.durer_transport = socketio;

  //Admin page auth setup
  server.app.use(mount('/team/admin', auth({ name: 'admin', pass: getAdminCredentials() })));
  server.app.use(mount('/game/admin', auth({ name: 'admin', pass: getAdminCredentials() })));

  //TODO regex mount protection for Boardgame.io endpoints

  configureTeamsRouter(server.router, teams, games);

  Sentry.init({ dsn: "https://1f4c47a1692b4936951908e2669a1e99@sentry.durerinfo.hu/4" });

  server.app.on("error", (err, ctx) => {
    Sentry.withScope(function (scope: any) {
      scope.addEventProcessor(function (event: any) {
        return Sentry.addRequestDataToEvent(event, ctx.request);
      });
      Sentry.captureException(err);
    });
  });

  server.run(PORT);
}