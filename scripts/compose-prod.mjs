#!/usr/bin/env node
// `docker compose` as the deployed stack is run: `.env.docker` for the
// secrets, and `docker-compose.tls.yml` on top whenever the checkout has one.
// Every `stack:prod*` script goes through here, so no command on a TLS host
// can bring `web` back without its port 443 and certificates by leaving the
// override out. DEPLOYMENT.md § 8 is where that file comes from; it is
// untracked, so its presence is what says this host serves TLS.
//
// Arguments are passed on to compose: `node scripts/compose-prod.mjs ps`.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const TLS_OVERRIDE = 'docker-compose.tls.yml';

export function composeArgs(hasTlsOverride, args) {
  return [
    'compose',
    '--env-file=.env.docker',
    '-f', 'docker-compose.yml',
    ...(hasTlsOverride ? ['-f', TLS_OVERRIDE] : []),
    ...args,
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hasTlsOverride = existsSync(`${repoRoot}${TLS_OVERRIDE}`);
  if (hasTlsOverride) console.log(`Including ${TLS_OVERRIDE}.`);
  const { status, error } = spawnSync(
    'docker',
    composeArgs(hasTlsOverride, process.argv.slice(2)),
    { cwd: repoRoot, stdio: 'inherit' },
  );
  if (error) throw error;
  process.exitCode = status ?? 1;
}
