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
import { readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';

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

function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function generateLoginCode() {
  return `${randomInt(1, 1000)}-${randomInt(1, 10000)}-${randomInt(1, 1000)}`;
}

// node: argv[0] vs server.ts: argv[1]
if (argv[2] == "import") {
  console.info("Importing teams.");
  console.info("Use a .tsv file (UTF-8 format, no quoted strings, no tab characters)");
  const filename = argv[3];
  const untrimmed_rows = readFileSync(filename, 'utf-8').split('\n');
  // Remove possible '\r' characters in windows CRLF
  const rows = untrimmed_rows.map(row => row.trim());
  const table = rows.map(row => row.split('\t'));
  const header = table.shift()!;
  const expected_header = ["Teamname", "Category", "Email", "Other", "ID", "Login Code"];
  if (!arraysEqual(header, expected_header)) {
    console.warn("WARNING: Header not exactly how we defined it. This is not always a problem.");
    console.warn(`Found: ${header.join(', ')}`);
    console.warn(`Expected: ${expected_header.join(', ')}`);
  }
  var export_table : string[][] = [];
  for (var row of table) {
    const [teamname, category, email, other, ...extra_columns] = row;
    let ok = true;
    let id = extra_columns[0];
    let login_code = extra_columns[1];
    // TODO make this more pragmatic
    if (!['C', 'D', 'E'].includes(category)) {
      console.error(`ERROR: Invalid category for team ${teamname}.`);
      ok = false;
    }

    // TODO check email

    if (other === undefined || other === "") {
      console.warn(`"Other" field not set for team ${teamname}`);
      console.warn(`This should include any info which could help identify a team. (team name, contestant names, school, email addresses, etc.)`);
    }

    if (id === undefined || id === "") {
      id = randomUUID();
    } else if (id.match(/^[0-9a-f\-]+$/) === null) {
      console.warn(`ID is not a GUID for team ${teamname}`);
      console.warn(`Found: ${id}`);
      console.warn(`Expected format is usually: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
    }

    if (login_code === undefined || login_code === "") {
      login_code = generateLoginCode();
    } else {
      console.warn(`ID is not a GUID for team ${teamname}`);
      console.warn(`Found: ${id}`);
      console.warn(`Expected: 111-2222-333`);
    }

    if (ok) {
      console.info(`Successfully imported team ${teamname}.`);
      const row_to_export = [teamname, category, email, other, id, login_code];
      export_table.push(row_to_export);
    } else {
      console.error(`Failed to import team ${teamname}.`);
    }
  }
  writeFileSync(`export-${filename}`, export_table.map(row => row.join('\t')).join('\n'), { 'encoding': 'utf-8' });
  exit(0);
}

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
async function injectBots(db: any) {
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
