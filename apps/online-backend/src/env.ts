import { config } from 'dotenv';
import { join } from 'node:path';

// dotenv resolves a bare `.env` against process.cwd(), so which file a process
// reads — if any — would depend on where it was started from. Anchor it to the
// package instead, so every entry reads the file `npm run setup` writes here.
// `__dirname` is the bundle's `dist`, one level below it.
//
// A missing file is not an error: the docker stack has none, because compose
// passes the settings in the environment, where dotenv leaves them alone.
config({ path: join(__dirname, '..', '.env'), quiet: true });
