// Turbo hashes a task from its own package's files plus the tasks it dependsOn.
// A workspace that compiles another package's *source* is reading files no hash
// of its own can see; whether that matters depends on whether a task edge
// happens to cover them. `^build` covers a package that is both a declared
// dependency and has a build task — that build's hash moves when its source
// does. Nothing covers a package with no build task, a package reached against
// the dependency direction, or a workspace whose turbo.json drops `^build` to
// avoid waiting on a package build. Those three cases must not cache, or a hit
// restores output built against source that has since moved.
//
// tsconfig.json's `paths` is what this reads, because it is the one place every
// such alias appears: apps/online-backend/tsdown.config.mts and
// apps/strategy-practice/vite.config.js each say their aliases are mirrored
// there, and it is `paths` that makes the typecheck read source in the first
// place. A path into a package *directory* or into its `dist` is not a crossing
// — that resolves through the exports map to built output, which the two
// practice frontends rely on.
import { existsSync, globSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const TASKS = ['build', 'typecheck'];

// tsconfig and turbo both allow comments, and both use them here. Every comment
// in the files this reads sits on a line of its own.
const readJsonc = (file) =>
  JSON.parse(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n'),
  );

const rootPackage = readJsonc(`${repoRoot}package.json`);
const rootTasks = readJsonc(`${repoRoot}turbo.json`).tasks;

const workspaces = rootPackage.workspaces
  .flatMap((pattern) => globSync(`${pattern}/package.json`, { cwd: repoRoot }))
  .map((path) => dirname(path).replaceAll('\\', '/'))
  .sort();

const manifests = Object.fromEntries(
  workspaces.map((workspace) => [workspace, readJsonc(`${repoRoot}${workspace}/package.json`)]),
);

const turboTasks = (workspace) => {
  const file = `${repoRoot}${workspace}/turbo.json`;
  return existsSync(file) ? readJsonc(file).tasks ?? {} : {};
};

const dependsOn = (workspace, task) =>
  turboTasks(workspace)[task]?.dependsOn ?? rootTasks[task]?.dependsOn ?? [];

const owningWorkspace = (path) =>
  workspaces.find((workspace) => !relative(`${repoRoot}${workspace}`, path).startsWith('..'));

// The read reaches source that some task hash already moves with: `^build` is
// in the reading task's edges, the package read is declared as a dependency,
// and it has a build whose hash those source files feed.
const coveredByAnEdge = (workspace, read) =>
  TASKS.every((task) => dependsOn(workspace, task).includes('^build'))
  && manifests[read]?.name
    in { ...manifests[workspace].dependencies, ...manifests[workspace].devDependencies }
  && Boolean(manifests[read]?.scripts?.build);

const crossingsOf = (workspace) => {
  const tsconfig = `${repoRoot}${workspace}/tsconfig.json`;
  if (!existsSync(tsconfig)) return [];

  return Object.values(readJsonc(tsconfig).compilerOptions?.paths ?? {})
    .flat()
    .filter((target) => target.startsWith('../'))
    // resolve() gives platform separators; the dist check reads the path, so it
    // is normalised first or a Windows `\dist\` counts as source.
    .map((target) => ({ target, path: resolve(dirname(tsconfig), target).replaceAll('\\', '/') }))
    .filter(({ path }) => !path.includes('/dist/') && /\.tsx?$/.test(path) && existsSync(path))
    .map((crossing) => ({ ...crossing, read: owningWorkspace(crossing.path) }))
    .filter(({ read }) => !coveredByAnEdge(workspace, read));
};

// A workspace with no such script has nothing to cache wrongly.
const cachedTasks = (workspace) =>
  TASKS.filter((task) => manifests[workspace].scripts?.[task])
    .filter((task) => turboTasks(workspace)[task]?.cache !== false);

const uncovered = workspaces
  .map((workspace) => ({ workspace, crossings: crossingsOf(workspace) }))
  .filter(({ crossings }) => crossings.length > 0);

describe('a workspace that compiles source no task hash reaches', () => {
  // Not an assertion about which workspaces they are — that may change — but a
  // guard against the list going empty because the detection broke rather than
  // because the crossings went away.
  it('is found by reading tsconfig paths', () => {
    expect(uncovered.map(({ workspace }) => workspace)).toContain('apps/online-backend');
  });

  it.each(uncovered)('does not cache build or typecheck: $workspace', ({ workspace, crossings }) => {
    expect(
      cachedTasks(workspace),
      `${workspace} compiles source no task hash reaches:\n`
      + crossings.map(({ target, read }) => `  ${target}  (${read})\n`).join('')
      + 'Nothing carries a change in those files into its task hash, so a cache hit would\n'
      + `restore stale output. Set "cache": false on those tasks in ${workspace}/turbo.json,\n`
      + 'or give the package it reads a build task and depend on it.',
    ).toStrictEqual([]);
  });
});
