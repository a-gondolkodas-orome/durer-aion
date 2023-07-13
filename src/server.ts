import { GameRelay } from './games/relay/game';
import { MyGame as TenCoinsGame } from './games/ten-coins/game';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as RelayStrategy } from './games/relay/strategy';
import { strategyWrapper as TenCoinsStrategy } from './games/ten-coins/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';
import { importer } from './server/team_import';

import auth from 'koa-basic-auth';
import mount from 'koa-mount';
import { closeMatch } from './server/team_manage';

import * as Sentry from "@sentry/node";

function getDb() {
  if (env.DATABASE_URL) {
    const CONNECTION_STRING = env.DATABASE_URL;
    const db = new PostgresStore(CONNECTION_STRING);
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
  C: 'tencoins_c',
  D: 'tencoins_d',
  E: 'tencoins_e',
}

const games = [
  { ...GameRelay, name: relayNames.C },
  { ...GameRelay, name: relayNames.D },
  { ...GameRelay, name: relayNames.E },
  { ...gameWrapper(TenCoinsGame), name: strategyNames.C },
  { ...gameWrapper(TenCoinsGame), name: strategyNames.D },
  { ...gameWrapper(TenCoinsGame), name: strategyNames.E },
];


const bot_factories = [
  botWrapper(RelayStrategy("C")),
  botWrapper(RelayStrategy("D")),
  botWrapper(RelayStrategy("E")),
  botWrapper(TenCoinsStrategy("C")),
  botWrapper(TenCoinsStrategy("D")),
  botWrapper(TenCoinsStrategy("E")),
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
  importer(teams, filename).then(() => exit(0));
} else {
  const botSetup = Object.fromEntries(
    games.map((game, idx) =>
      [game.name,
      new (bot_factories[idx])({
        enumerate: game.ai?.enumerate,
        seed: game.seed,
      })]
    ));

  const server = Server({
    games: games,
    transport: new SocketIOButBotMoves(
      { https: undefined },
      botSetup,
      function onFinishedMatch(matchID) {
        closeMatch(matchID, teams, db);
      }
    ),
    db,
  });

  const PORT = parseInt(env.PORT || "8000");

  //Admin page auth setup
  server.app.use(mount('/team/admin', auth({ name: 'admin', pass: getAdminCredentials() })));

  //TODO regex mount protection for Boardgame.io endpoints

  configureTeamsRouter(server.router, teams, games);

  Sentry.init({ dsn: "https://1f4c47a1692b4936951908e2669a1e99@sentry.durerinfo.hu/4" });

  server.app.on("error", (err, ctx) => {
    Sentry.withScope(function (scope:any) {
      scope.addEventProcessor(function (event:any) {
        return Sentry.addRequestDataToEvent(event, ctx.request);
      });
      Sentry.captureException(err);
    });
  });

  server.run(PORT);
}