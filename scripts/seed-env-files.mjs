#!/usr/bin/env node
// Creates every gitignored env file this repo expects a developer to write by
// hand, by copying its committed `*.sample` twin. Run by `npm run setup` and by
// the dev container's post-create step, so both routes seed the same set.
//
// An existing file is never overwritten: a developer's own values live there,
// and in `.env.docker` those are credentials worth keeping.

import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUFFIX = '.sample';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function samplesIn(dir) {
  return readdirSync(join(repoRoot, dir))
    .filter((name) => name.startsWith('.env') && name.endsWith(SUFFIX))
    .map((name) => join(dir, name));
}

const appDirs = readdirSync(join(repoRoot, 'apps'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join('apps', entry.name));

const seeded = ['.', ...appDirs].flatMap(samplesIn).filter((sample) => {
  const target = sample.slice(0, -SUFFIX.length);
  if (existsSync(join(repoRoot, target))) return false;
  copyFileSync(join(repoRoot, sample), join(repoRoot, target));
  console.log(`seeded ${target}`);
  return true;
});

console.log(
  seeded.length === 0
    ? 'Every env file already exists — nothing seeded.'
    : `Seeded ${seeded.length} env file(s) with the sample values. They are enough to run
the stack locally; see "Configuration you may want to change" in README.md for
the ones worth editing.`,
);
