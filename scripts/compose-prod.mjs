#!/usr/bin/env node
// `docker compose` as the deployed stack is run: `.env.docker` for the
// secrets, and on top of `docker-compose.yml` whichever per-machine overrides
// the checkout has. Every `stack:prod*` script goes through here, so no
// command on a TLS host can bring `web` back without its port 443 and
// certificates by leaving the override out. docs/DEPLOYMENT.md § 8 is where the TLS
// file comes from; both are untracked, so their presence is what says this
// host uses them.
//
// `docker-compose.override.yml` is listed because compose reads it on its own
// only when no `-f` is given, and this always gives one.
//
// Arguments are passed on to compose: `node scripts/compose-prod.mjs ps`.

import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const OPTIONAL_FILES = ['docker-compose.override.yml', 'docker-compose.tls.yml'];

export function composeArgs(presentFiles, args) {
  return [
    'compose',
    '--env-file=.env.docker',
    '-f', 'docker-compose.yml',
    ...OPTIONAL_FILES.filter(file => presentFiles.includes(file)).flatMap(file => ['-f', file]),
    ...args,
  ];
}

// Real paths on both sides: through a symlink the two differ, and a mismatch
// here would skip compose and exit 0 — a deploy that reports success.
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const present = OPTIONAL_FILES.filter(file => existsSync(`${repoRoot}${file}`));
  for (const file of present) console.log(`Including ${file}.`);
  const { status, error } = spawnSync(
    'docker',
    composeArgs(present, process.argv.slice(2)),
    { cwd: repoRoot, stdio: 'inherit' },
  );
  if (error) throw error;
  process.exitCode = status ?? 1;
}
