import './env';
import {
  GameRelay,
  MyGameWrappers as strategyGameWrappers,
  gameWrapper,
  strategyNames,
} from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import { RelayStrategy } from 'relay-bot';
import { argv, env, exit } from 'process';
import { SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import botWrapper from './botwrapper';
import { configureTeamsRouter } from './server/router';
import { getDb } from './server/db';
import { getAdminCredentials, getBotCredentials, relayNames } from './server/common';
import { requireAdmin } from './server/admin_session';

import { closeMatch } from './server/team_manage';

const games = [
  { ...GameRelay, name: relayNames.C },
  { ...GameRelay, name: relayNames.D },
  { ...GameRelay, name: relayNames.E },
  { ...gameWrapper(strategyGameWrappers.C()), name: strategyNames.C },
  { ...gameWrapper(strategyGameWrappers.D()), name: strategyNames.D },
  { ...gameWrapper(strategyGameWrappers.E()), name: strategyNames.E },
];


const bot_factories = [
  botWrapper(RelayStrategy("C")),
  botWrapper(RelayStrategy("D")),
  botWrapper(RelayStrategy("E")),
  botWrapper(StrategyStrategy.C()),
  botWrapper(StrategyStrategy.D()),
  botWrapper(StrategyStrategy.E()),
];

if (argv[2] === "sanity-check") {
  console.log("OK");
  exit(0);
}

getBotCredentials(); // give love if no creds are supplied
getAdminCredentials(); // give love if no creds are supplied

const { db, teams } = getDb();

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
    // This runs inside a socket listener nothing awaits, so an error escaping
    // it is an unhandled rejection, which ends the process and the round with it.
    try {
      await closeMatch(matchID, teams, db);
    } catch (error) {
      console.error(`Could not close match: ${matchID}`, error);
    }
  },
);
const server = Server({
  games: games,
  transport: socketio,
  db,
});

const PORT = parseInt(env.PORT || "8000");

server.app.context.durer_transport = socketio;

// Behind nginx every request arrives over plain HTTP; `X-Forwarded-Proto` is
// how koa learns it was HTTPS to the browser, and the session cookie takes
// its `Secure` flag from that (see server/team_session.ts). This trusts the
// `X-Forwarded-*` headers of whoever reaches this port — the scheme, and
// with it the host and ip koa reports — so the docker stack does not
// publish it: only nginx, which sets them, can.
server.app.proxy = true;

// The organisers' login travels with the admin routes rather than being
// mounted on the prefix they share — server/admin_session.ts says why.
configureTeamsRouter(server.router, teams, games, requireAdmin(getAdminCredentials()));

void server.run(PORT);
