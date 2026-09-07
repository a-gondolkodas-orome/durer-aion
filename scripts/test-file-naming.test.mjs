// A suite's file name decides which project runs it, and getting it wrong fails quietly.
// `vitest.config.mts` runs two: the root project takes `*.test.{ts,tsx}` under any workspace's
// `src/`, and `apps/strategy-practice/vite.config.js` takes `*.spec.{ts,tsx}` under the three
// directories that app's code lives in. Nothing owns the gap between them. A `*.spec.ts` written
// in `packages/game` matches neither project, so it never runs, CI stays green and the file looks
// like coverage it is not; a `*.test.ts` written under `apps/strategy-practice/src` is picked up
// by the root project instead, without that app's aliases or setup file, and fails on an import
// it should resolve. Both are one rename away, once someone knows — which is what this test is.
//
// The spec roots are read out of that config rather than repeated here, so adding a fourth one
// there is all it takes to teach this test about it.
import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const APP = 'apps/strategy-practice';
const SUITE = /\.(test|spec)\.tsx?$/;
// Build output and dependencies hold copies of suites that no project runs.
const SKIP = new Set(['node_modules', 'dist', 'build', 'reports', 'coverage']);

// Every `*.spec.{ts,tsx}` glob in the app's vite config — `test.include`, and the same three paths
// again under `coverage.exclude` — reduced to the directories they cover, relative to the root.
function specRoots() {
  const config = readFileSync(join(repoRoot, APP, 'vite.config.js'), 'utf8');
  const globs = [...config.matchAll(/'([^']*)\/\*\*\/\*\.spec\.\{ts,tsx\}'/g)];

  return [...new Set(globs.map(([, dir]) => posix.normalize(`${APP}/${dir}`)))].sort();
}

function* suitesIn(dir) {
  for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = posix.join(dir, entry.name);

    if (entry.isDirectory()) yield* suitesIn(path);
    else if (SUITE.test(entry.name)) yield path;
  }
}

const list = files => files.map(file => `  ${file}`).join('\n');

describe('a suite is named for the project that runs it', () => {
  const roots = specRoots();
  const suites = [...suitesIn('apps'), ...suitesIn('packages')].sort();
  // The root project's glob is `{apps,packages}/*/src/**`, so the third segment decides.
  const underWorkspaceSrc = file => file.split('/')[2] === 'src';
  const inSpecRoot = file => roots.some(root => file.startsWith(`${root}/`));

  it('reads the spec roots out of the strategy-practice config', () => {
    expect(
      roots,
      `No \`*.spec.{ts,tsx}\` globs found in ${APP}/vite.config.js. Its \`test.include\` is what `
      + 'says which directories hold specs, and this test derives them from it.'
    ).not.toStrictEqual([]);
  });

  it('lives under a workspace src/, or no project runs it', () => {
    const stray = suites.filter(file => !underWorkspaceSrc(file));

    expect(
      stray,
      `These suites are outside a workspace's \`src/\`, so neither project's glob reaches them and `
      + `they never run:\n${list(stray)}\nMove each one under its workspace's \`src/\`.`
    ).toStrictEqual([]);
  });

  it('ends in .spec where the strategy-practice project looks', () => {
    const wrong = suites.filter(file => inSpecRoot(file) && !file.endsWith('.spec.ts') && !file.endsWith('.spec.tsx'));

    expect(
      wrong,
      `These suites are under ${roots.join(', ')}, where the strategy-practice project takes `
      + `\`*.spec.{ts,tsx}\` only. As \`.test\` they run under the root project instead — no `
      + `aliases, no \`test-setup.ts\` — and fail on imports they should resolve:\n${list(wrong)}\n`
      + 'Rename each to `.spec`.'
    ).toStrictEqual([]);
  });

  it('ends in .test everywhere else', () => {
    const wrong = suites.filter(file =>
      underWorkspaceSrc(file) && !inSpecRoot(file) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'));

    expect(
      wrong,
      `These suites are outside ${roots.join(', ')}, where the root project takes `
      + `\`*.test.{ts,tsx}\` only. As \`.spec\` they match no project at all, so they never run and `
      + `nothing says so:\n${list(wrong)}\nRename each to \`.test\`.`
    ).toStrictEqual([]);
  });
});
