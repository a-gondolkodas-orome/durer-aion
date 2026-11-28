import './env';
import { argv, env, exit } from 'process';
import { botFailureMode, SocketIOButBotMoves } from './socketio_botmoves';
import { Server } from 'boardgame.io/server';
import { hostedGames } from './games';
import { BotPool } from './bot_pool';
import { askingBotWrapper } from 'game';
import { join } from 'path';
import { strategyGames } from 'game/strategy';
import { assertValidRegistry } from 'problem-bank';
import { registry } from 'problem-bank/all';
import { configureTeamsRouter } from './server/router';
import { getDb } from './server/db';
import { openContentSources } from './server/database_sources';
import { getAdminCredentials, getBotCredentials } from './server/common';
import { requireAdmin } from './server/admin_session';

// CI validates the same registry (packages/problem-bank/src/registry.test.ts);
// this catches one that reached a server without it, such as a private repo's
// edit, before any team starts a match.
assertValidRegistry(registry, strategyGames);

const hosted = hostedGames();
const games = hosted.map(({ game }) => game);

// Built beside this file (tsdown.config.mts). Each strategy runs in one of
// these, under a deadline (docs/ARCHITECTURE.md § *How the bot gets its turn*).
const pool = new BotPool({ worker: join(__dirname, 'bot_worker.js') });

if (argv[2] === "sanity-check") {
  // Starting the workers loads what they require, so the image build fails on
  // a dependency the worker lacks, as on one the server lacks (Dockerfile).
  pool.start().then(() => pool.close()).then(() => {
    console.log("OK");
    exit(0);
  }, (e: unknown) => {
    console.error('the bot workers failed to start', e);
    exit(1);
  });
} else {
  serve();
}

/** Everything but the sanity check: the database, the bots and the port. */
function serve() {
  getBotCredentials(); // give love if no creds are supplied
  getAdminCredentials(); // give love if no creds are supplied
  const botFailure = botFailureMode(env.BOT_FAILURE);

  const { db, teams } = getDb();

  const botSetup = Object.fromEntries(
    hosted.map(({ game }) => {
      const bot = askingBotWrapper((state, botID, setupData) => pool.ask(game.name, state, botID, setupData));
      return [game.name, new bot({ enumerate: game.ai?.enumerate, seed: game.seed })];
    }));

  const socketio = new SocketIOButBotMoves(
    { https: undefined },
    botSetup,
    {},
    botFailure,
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

  // The one place that picks where competitions and problems are read from: the
  // code and the database together. An id both hold stops the server here.
  Promise.all([openContentSources(teams, registry), pool.start()]).then(async ([sources]) => {
    // The organisers' login travels with the admin routes rather than being
    // mounted on the prefix they share — server/admin_session.ts says why.
    configureTeamsRouter(server.router, teams, games, requireAdmin(getAdminCredentials()), sources);
    await server.run(PORT);
  }).catch((e: unknown) => {
    console.error('the server failed to start', e);
    exit(1);
  });
}
