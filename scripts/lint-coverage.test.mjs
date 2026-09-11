// `npm run lint` is one ESLint process per workspace rather than one over the whole
// repo — turbo.json says why — and that splits the question "was this file linted?"
// across one command per workspace plus a pass for the rest. Two ways a file falls
// between them, neither showing as anything but a green run: a workspace with no
// `lint` script, which turbo skips, and a directory under apps/ or packages/ that is
// not a workspace at all, which the root pass ignores and no workspace claims. This
// is what says so.
//
// The authority on what counts as lintable is ESLint's own config: the extensions its
// `files` patterns take, and `isPathIgnored` for everything it has been told to skip.
// The SKIP set below is about not walking into large directories, not about what is
// linted.
import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// turbo.json allows comments and uses them, every one on a line of its own — the same
// shape scripts/turbo-source-crossing.test.mjs reads it in. package.json has none and
// does not mind being read this way.
const readJsonc = file =>
  JSON.parse(
    readFileSync(join(repoRoot, file), 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
  );

const rootPackage = readJsonc('package.json');
const turbo = readJsonc('turbo.json');

const LINT = 'eslint . --max-warnings=0';
const LINT_FIX = 'eslint . --fix';
const LINTABLE = /\.(js|mjs|cjs|mts|ts|tsx)$/;
const SKIP = new Set(['node_modules', '.git', '.turbo', 'dist', 'build', 'coverage', 'site']);

// The workspace globs are all `<dir>/*` or a literal path, so one directory level
// below the glob's parent is the workspace. Read from package.json rather than listed,
// so a workspace added later is covered the day it lands.
const workspaces = rootPackage.workspaces
  .flatMap(pattern => (pattern.endsWith('/*')
    ? readdirSync(join(repoRoot, pattern.slice(0, -2)), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => posix.join(pattern.slice(0, -2), entry.name))
    : [pattern]))
  .sort();

// What the root pass leaves to turbo, taken from the script itself so the two cannot
// disagree. Every pattern is a directory prefix; the assertion below fails loudly if
// one stops being.
const rootPassIgnores = [...rootPackage.scripts['lint:root'].matchAll(/--ignore-pattern "([^"]+)"/g)]
  .map(([, pattern]) => pattern);

function* filesIn(dir) {
  for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = dir === '.' ? entry.name : posix.join(dir, entry.name);

    if (entry.isDirectory()) yield* filesIn(path);
    else if (LINTABLE.test(entry.name)) yield path;
  }
}

const list = items => items.map(item => `  ${item}`).join('\n');

describe('the per-workspace lint split', () => {
  it('gives every workspace the two scripts turbo runs', () => {
    const missing = workspaces.flatMap((workspace) => {
      const { scripts = {} } = JSON.parse(readFileSync(join(repoRoot, workspace, 'package.json'), 'utf8'));
      const wrong = (name, expected) =>
        scripts[name] === expected ? [] : [`${workspace}: "${name}" must be \`${expected}\`, is ${JSON.stringify(scripts[name])}`];

      return [...wrong('lint', LINT), ...wrong('lint:fix', LINT_FIX)];
    });

    expect(
      missing,
      `turbo runs a task only for a workspace whose package.json has that script, so a `
      + `workspace without these is skipped in silence:\n${list(missing)}`
    ).toStrictEqual([]);
  });

  it('runs both the workspace tasks and the root pass from `npm run lint`', () => {
    expect(rootPackage.scripts.lint).toBe('turbo run lint lint:root --concurrency=2');
    expect(rootPackage.scripts['lint:fix']).toBe('turbo run lint:fix lint:fix:root --concurrency=2');
    // Declared as root tasks, which is both what makes turbo run them and what keeps
    // the root `lint` script from recursing into itself.
    expect(turbo.tasks['//#lint:root']).toBeDefined();
    expect(turbo.tasks['//#lint:fix:root']).toBeDefined();
  });

  it('does not cache a task that reads another workspace\'s source', () => {
    // Type-aware lint reads across package boundaries, which a per-package input hash
    // does not cover — the reasoning is scripts/turbo-source-crossing.test.mjs's, and
    // this pins the same property for the tasks that test's `coveredByAnEdge` cannot
    // reason about, having no `^build` edge to follow.
    for (const task of ['lint', 'lint:fix', '//#lint:root', '//#lint:fix:root']) {
      expect(turbo.tasks[task].cache, `turbo.json: "${task}" must not cache`).toBe(false);
    }
  });

  it('claims every lintable file for a workspace or the root pass', async () => {
    const prefixes = rootPassIgnores.map((pattern) => {
      expect(pattern, 'the root pass\'s ignore patterns must each be a directory prefix')
        .toMatch(/^[\w.-]+\/\*\*$/);
      return pattern.slice(0, -2);
    });

    const eslint = new ESLint({ cwd: repoRoot });
    const files = [...filesIn('.')].sort();
    const uncovered = [];

    for (const file of files) {
      if (await eslint.isPathIgnored(join(repoRoot, file))) continue;
      if (workspaces.some(workspace => file.startsWith(`${workspace}/`))) continue;
      if (prefixes.some(prefix => file.startsWith(prefix))) uncovered.push(file);
    }

    expect(
      uncovered,
      `These files are under a path the root pass ignores and in no workspace, so `
      + `nothing lints them:\n${list(uncovered)}\nMake the directory a workspace with a `
      + '`lint` script, or narrow the root pass\'s --ignore-pattern in package.json.'
    ).toStrictEqual([]);
  });
});
