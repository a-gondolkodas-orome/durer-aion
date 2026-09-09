// A suite no project's glob reaches never runs, and nothing says so: the run is
// green and the file reads as coverage it is not. The root vitest project takes
// `{apps,packages}/*/src/**`, so a suite written beside its subject rather than
// under a workspace's `src/` is skipped in silence. This is what makes it loud.
//
// Which of the two projects owns a file is decided by its path — vitest.config.mts
// excludes the directories apps/strategy-practice's own config includes — so the
// name is the same everywhere, and the second rule below is what keeps it so: a
// `.spec` left behind, or written out of habit, now matches no glob at all.
import { readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const SUITE = /\.(test|spec)\.tsx?$/;
// Build output and dependencies hold copies of suites that no project runs.
const SKIP = new Set(['node_modules', 'dist', 'build', 'reports', 'coverage']);

function* suitesIn(dir) {
  for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = posix.join(dir, entry.name);

    if (entry.isDirectory()) yield* suitesIn(path);
    else if (SUITE.test(entry.name)) yield path;
  }
}

const list = files => files.map(file => `  ${file}`).join('\n');

describe('every suite is somewhere a project looks', () => {
  const suites = [...suitesIn('apps'), ...suitesIn('packages')].sort();

  it('lives under a workspace src/', () => {
    // The root project's glob is `{apps,packages}/*/src/**`, so the third segment decides.
    const stray = suites.filter(file => file.split('/')[2] !== 'src');

    expect(
      stray,
      `These suites are outside a workspace's \`src/\`, so no project's glob reaches them `
      + `and they never run:\n${list(stray)}\nMove each one under its workspace's \`src/\`.`
    ).toStrictEqual([]);
  });

  it('is named .test, the one suffix both projects look for', () => {
    const spec = suites.filter(file => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'));

    expect(
      spec,
      `These suites are not named \`.test\`, which is the only suffix either project's glob `
      + `takes, so they never run:\n${list(spec)}\nRename each to \`.test\`.`
    ).toStrictEqual([]);
  });
});
