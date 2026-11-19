// The team import, as its own process rather than a mode of the server: a TSV
// load reads neither the bot password nor the admin password, and needs none of
// the games, bots or socket transport.
import './env';
import { argv, exit } from 'process';
import { registry } from 'problem-bank/all';
import { getDb } from './server/db';
import { openContentSources } from './server/database_sources';
import { import_teams_from_tsv_locally } from './server/team_import';

// node: argv[0] vs import_teams.js: argv[1]
const filename = argv[2];
if (filename === undefined) {
  console.error('Usage: import_teams.js <teams.tsv>');
  exit(2);
}

const { teams } = getDb();

// The same sources as the server's (server.ts), so a team is imported only
// into a competition the server would let it play.
openContentSources(teams, registry).then(async ({ competitionSource }) => {
  await import_teams_from_tsv_locally(teams, filename, competitionSource);
  exit(0);
}).catch((e: unknown) => {
  console.error('team import failed', e);
  exit(1);
});
