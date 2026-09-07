#!/usr/bin/env node
// Creates every gitignored env file this repo expects a developer to write by
// hand, by copying its committed `*.sample` twin, and reports the settings a
// file that already exists has fallen behind on. Run by `npm run setup`, by the
// dev container's post-create step, and by each `dev:*` script, so all three
// routes seed the same set and warn at the moment a stale file would bite.
//
// An existing file is never overwritten: a developer's own values live there,
// and in `.env.docker` those are credentials worth keeping.

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

function samplesIn(dir) {
  return readdirSync(join(repoRoot, dir))
    .filter((name) => name.startsWith('.env') && name.endsWith(SUFFIX))
    .map((name) => join(dir, name));
}

function main() {
  const appDirs = readdirSync(join(repoRoot, 'apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join('apps', entry.name));

  const seeded = [];
  const behind = [];

  for (const sample of ['.', ...appDirs].flatMap(samplesIn)) {
    const target = sample.slice(0, -SUFFIX.length);
    if (!existsSync(join(repoRoot, target))) {
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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
