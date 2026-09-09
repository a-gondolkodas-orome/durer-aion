import { config } from 'dotenv';
import { join } from 'node:path';

// dotenv resolves a bare `.env` against process.cwd(), so which file a process
// read — if any — depended on where it was started from: `npm start` runs from
// this package and found one, `node dist/import_teams.js` from the repo root or
// from /usr/src/app found nothing (#190). Anchor it to the package instead, so
// every entry reads the file `npm run setup` writes here. `__dirname` is the
// bundle's `dist`, one level below it.
//
// A missing file is not an error: the docker stack has none, because compose
// passes the settings in the environment, where dotenv leaves them alone.
config({ path: join(__dirname, '..', '.env'), quiet: true });
