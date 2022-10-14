import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyGame as ChessBishopsGame } from './games/chess-bishops/game';
import { PostgresStore } from 'bgio-postgres';
import { argv, env, exit } from 'process';
import { gameWrapper } from './common/gamewrapper';
import { BOT_ID, fetch, SocketIOButBotMoves } from './socketio_botmoves';
import { Server, SocketIO } from 'boardgame.io/server';
import botWrapper from './common/botwrapper';
import { strategy as TicTacToeStrategy } from './games/tictactoe/strategy';
import { strategy as SuperstitiousCountingStrategy } from './games/superstitious-counting/strategy';
import { strategy as ChessBishopsStrategy } from './games/chess-bishops/strategy';
import { configureTeamsRouter } from './server/router';
import { TeamsRepository } from './server/db';
import { importer } from './server/team_import';

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

// node: argv[0] vs server.ts: argv[1]
if (argv[2] == "import") {
  const filename = argv[3];
  importer(teams, filename).then(() => exit(0));
} else {
  const server = Server({
    games: games,
    transport: new SocketIOButBotMoves(
      { https: undefined },
      { "tic-tac-toe": bots[0], "superstitious-counting": bots[1], "chess-bishops": bots[2] },
    ),
    db,
  });

  const PORT = parseInt(env.PORT || "8000");

  /** Joins a bot to all matches where the bot's side is not connected.
   * 
   * TODO inject bots only where it is needed.
   * 
   * This should be in line with boardgame.io/src/server/api.ts
   * path would be '/games/:name/:id/join'.
   */
  const injectBots = async (db: any) => {
    console.log("Injecting listing matches!");
    for (let matchID of await db.listMatches()) {
      console.log(`Found match ${matchID}`);
      var match = await fetch(db, matchID, {metadata: true});
      // TODO do not connect a bot to ALL unconnected
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

  configureTeamsRouter(server.router, teams);
  server.run(PORT);
}