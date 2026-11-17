#!/usr/bin/env node
// `npm run teams:import`: runs the importer inside the running backend
// container, as the calling user. The prod image runs as `node` (uid 1000),
// and the importer writes `<file>.tsv.export` into the bind-mounted scripts/,
// which uid 1000 can write only when it happens to own it (#784).
//
// A script rather than `--user "$(id -u):$(id -g)"` in package.json, because
// npm runs scripts under cmd.exe on Windows. Docker Desktop's bind mounts do not
// check the uid, and Windows has no process.getuid, so there it passes none.

import { spawnSync } from 'node:child_process';

const user = process.getuid ? ['--user', `${process.getuid()}:${process.getgid()}`] : [];

const { status, error } = spawnSync(
  'docker',
  ['compose', '--env-file=.env.docker', 'exec', ...user, 'backend', './scripts/import_teams.sh', ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
if (error) {
  console.error(error.code === 'ENOENT' ? 'teams:import needs docker on the PATH.' : error.message);
  process.exit(1);
}
process.exit(status ?? 1);
