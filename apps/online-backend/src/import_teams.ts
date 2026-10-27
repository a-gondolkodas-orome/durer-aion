// The team import, as its own process rather than a mode of the server: a TSV
// load reads neither the bot password nor the admin password, and needs none of
// the games, bots or socket transport. `import_teams.test.ts` keeps it separate.
import './env';
import { argv, exit } from 'process';
import { getDb } from './server/db';
import { import_teams_from_tsv_locally } from './server/team_import';

// node: argv[0] vs import_teams.js: argv[1]
const filename = argv[2];
if (filename === undefined) {
  console.error('Usage: import_teams.js <teams.tsv>');
  exit(2);
}

const { teams } = getDb();

import_teams_from_tsv_locally(teams, filename).then(() => exit(0)).catch((e: unknown) => {
  console.error('team import failed', e);
  exit(1);
});
