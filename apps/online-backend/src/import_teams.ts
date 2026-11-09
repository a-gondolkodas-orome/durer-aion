// The team import, as its own process rather than a mode of the server: a TSV
// load reads neither the bot password nor the admin password, and needs none of
// the games, bots or socket transport.
import './env';
import { argv, exit } from 'process';
import { getDb } from './server/db';
import { import_teams_from_tsv_locally } from './server/team_import';

// node: argv[0] vs import_teams.js: argv[1]. Every team of the file enters the
// one competition named.
const [competitionId, filename] = argv.slice(2);
if (competitionId === undefined || filename === undefined) {
  console.error('Usage: import_teams.js <competition id> <teams.tsv>');
  exit(2);
}

const { teams } = getDb();

import_teams_from_tsv_locally(teams, competitionId, filename).then(() => exit(0)).catch((e: unknown) => {
  console.error('team import failed', e);
  exit(1);
});
