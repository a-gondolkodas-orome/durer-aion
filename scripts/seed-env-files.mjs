#!/usr/bin/env node
// Creates every gitignored env file this repo expects a developer to write by
// hand, by copying its committed `*.sample` twin, and reports the settings a
// file that already exists has fallen behind on. Run by `npm run setup`, by the
// dev container's post-create step, and by each `dev:*` script, so all three
// routes seed the same set and warn at the moment a stale file would bite.
//
// An existing file is never overwritten: a developer's own values live there,
// and in `.env.docker` those are credentials worth keeping.
//
// `--check` writes nothing: it reports what the deployed stack is missing and
// exits non-zero, which is what `stack:prod` runs before it builds. What it buys
// is the moment: `docker compose --env-file` opens `.env.docker` only once the
// bundle is built, and a frontend's values are inlined into that bundle, so
// without this the first thing anyone hears is compose naming one file, after a
// build that already went out wrong. Seeding instead would be worse than either:
// the samples carry `ADMIN_CREDENTIALS=admin` and a postgres password to match,
// and a host that seeded them mid-deploy would come up on credentials nobody
// chose. It cannot check that anyone *edited* those — no value is ever read
// here, see `missingKeys` — so DEPLOYMENT.md § 4 asking the operator to is still
// what stands between a deployment and the sample password.

import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUFFIX = '.sample';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const keysOf = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#') && line.includes('='))
    .map((line) => line.replace(/^export\s+/, '').split('=')[0].trim())
    .filter((key) => key !== '');

// Key names only — values are never read, let alone compared or printed. Every
// setting left in these files is one a developer's copy is meant to differ on:
// the credentials, DATABASE_URL, a real Sentry DSN or S3 bucket where the
// sample has a placeholder. Reporting those differences would be noise on every
// run, and a check that never reads a value cannot leak one. Extra keys are not
// reported either: docker-compose.yml's `${WEB_PORT:-80}`
// escape hatch is deliberately absent from the sample, so anyone using it would
// be nagged for doing the supported thing (#443).
export const missingKeys = (sampleText, targetText) => {
  const present = new Set(keysOf(targetText));
  return keysOf(sampleText).filter((key) => !present.has(key));
};

// The env files the deployed stack reads, and the only ones `--check` blocks a
// deployment on. `.env.docker` is what `docker compose --env-file` opens; the
// other two are inlined into the one bundle `stack:prod` builds, `.env.local` by
// common-frontend and the third by online-frontend itself. The three left out
// are read by builds a deployment never runs — the dry run's and the relay
// practice site's — and by `npm run dev:server`, which a deployed host does not
// use either: the docker stack has no `apps/online-backend/.env` on purpose,
// because compose passes the backend its environment and dotenv leaves it alone
// (`apps/online-backend/src/env.ts`, and `.dockerignore` keeps the file out of
// the image). Stopping a deployment for one of those would be demanding a file
// nothing on that path opens. `npm run setup` still seeds all six.
export const DEPLOYED_STACK_READS = [
  '.env.docker',
  '.env.local',
  join('apps', 'online-frontend', '.env'),
];

// A file that exists but has fallen behind fails the check as surely as one that
// is not there: the sample gained a key, the deployment's build inlines it as
// undefined, and nothing downstream says so. It is also the likelier of the two
// on DEPLOYMENT.md § 9's `git pull && npm run stack:prod`, where every file was
// written once at § 4 and the samples are what moved.
export const checkFailed = ({ absent, behind }) => absent.length > 0 || behind.length > 0;

function samplesIn(dir) {
  return readdirSync(join(repoRoot, dir))
    .filter((name) => name.startsWith('.env') && name.endsWith(SUFFIX))
    .map((name) => join(dir, name));
}

// `check` is a parameter rather than a read of `process.argv`, because
// scripts/prepare.mjs imports this function: what it does should follow from
// what its caller asked for, not from the command line that caller happens to
// have been started with.
export function main({ check = false } = {}) {
  const appDirs = readdirSync(join(repoRoot, 'apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join('apps', entry.name));

  const seeded = [];
  const absent = [];
  const behind = [];

  for (const sample of ['.', ...appDirs].flatMap(samplesIn)) {
    const target = sample.slice(0, -SUFFIX.length);
    if (check && !DEPLOYED_STACK_READS.includes(target)) continue;
    if (!existsSync(join(repoRoot, target))) {
      if (check) {
        absent.push({ target, sample });
        continue;
      }
      copyFileSync(join(repoRoot, sample), join(repoRoot, target));
      seeded.push(target);
      continue;
    }
    const missing = missingKeys(
      readFileSync(join(repoRoot, sample), 'utf8'),
      readFileSync(join(repoRoot, target), 'utf8'),
    );
    if (missing.length > 0) behind.push({ target, sample, missing });
  }

  for (const target of seeded) console.log(`seeded ${target}`);

  // Silence when every file is current: this runs before each `dev:*` script,
  // and output nobody needs is output nobody reads.
  for (const { target, sample, missing } of behind) {
    console.log(`${target} is missing ${missing.join(', ')} — copy from ${sample}`);
  }

  if (seeded.length > 0) {
    console.log(`Seeded ${seeded.length} env file(s) with the sample values. They are enough to run
the stack locally; see "Configuration you may want to change" in README.md for
the ones worth editing.`);
  }

  for (const { target, sample } of absent) {
    console.log(`${target} does not exist — copy it from ${sample} and fill in the values`);
  }

  if (check && checkFailed({ absent, behind })) {
    const count = absent.length + behind.length;
    console.log(`${count} env file(s) the deployed stack reads are not ready, and nothing here
was written. Locally, "npm run setup" fills them from the samples; a deployment
supplies its own values — see "Configuration you may want to change" in
README.md.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main({ check: process.argv.includes('--check') });
}
