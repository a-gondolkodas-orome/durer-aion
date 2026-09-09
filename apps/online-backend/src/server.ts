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

import * as Sentry from '@sentry/node';

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

// Behind nginx every request arrives over plain HTTP; `X-Forwarded-Proto` is
// how koa learns it was HTTPS to the browser, and the session cookie takes
// its `Secure` flag from that (see server/team_session.ts). This trusts the
// `X-Forwarded-*` headers of whoever reaches this port — the scheme, and
// with it the host and ip koa reports — so the docker stack does not
// publish it: only nginx, which sets them, can.
server.app.proxy = true;

//TODO regex mount protection for Boardgame.io endpoints

// The organisers' login travels with the admin routes rather than being
// mounted on the prefix they share — server/admin_session.ts says why.
configureTeamsRouter(server.router, teams, games, requireAdmin(getAdminCredentials()));

Sentry.init({ dsn: "https://1f4c47a1692b4936951908e2669a1e99@sentry.durerinfo.hu/4" });

server.app.on("error", (err, ctx) => {
  Sentry.withScope(function (scope: Sentry.Scope) {
    // addRequestDataToEvent is gone since v9; the default requestData
    // integration picks the request up from this metadata key instead.
    scope.setSDKProcessingMetadata({
      normalizedRequest: {
        url: ctx.request.href,
        method: ctx.request.method,
        query_string: ctx.request.querystring,
        // Minus the logins: the cookie is the team's session
        // (server/team_session.ts) and the authorization header the admin
        // password, and an error report is no place for either.
        headers: { ...ctx.request.headers, cookie: undefined, authorization: undefined },
      },
    });
    Sentry.captureException(err);
  });
});

void server.run(PORT);
