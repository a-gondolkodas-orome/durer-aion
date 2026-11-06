// The deploy's build has to measure the same thing as CI's `npm run build`, which is
// `turbo build`: a push to main *is* the cutover, so an app that builds here but not in CI
// takes the site down with a green PR. The one way that goes wrong is an app built with a
// bare `npm run build` inside its own directory — no `^build` in front of it, so a workspace
// package it imports has no `dist` (issue #451). Pin the shape of the script's build steps
// rather than the apps' output, which only a full build would show.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const script = readFileSync(`${repoRoot}scripts/assemble-site.mjs`, 'utf8');

// The apps the assembled site is made of, read off the copies into site/ rather than listed
// here, so an app added to the deploy is covered the day it lands.
const appDirs = [...script.matchAll(/cpSync\(join\(repoRoot, 'apps\/([\w-]+)\/dist'\)/g)].map(m => m[1]);

// turbo filters by package name, which need not be the directory name.
const packageName = dir =>
  JSON.parse(readFileSync(`${repoRoot}apps/${dir}/package.json`, 'utf8')).name;

const turboFilters = [...script.matchAll(/run\('npx', \['turbo', 'build', '--filter=([\w-]+)'\]/g)].map(m => m[1]);

describe('assemble-site.mjs', () => {
  it('copies at least the three apps the site is made of', () => {
    expect(appDirs.length).toBeGreaterThanOrEqual(3);
  });

  it('builds every app it assembles through turbo', () => {
    expect(turboFilters.toSorted()).toEqual(appDirs.map(packageName).toSorted());
  });

  it('runs no build outside turbo', () => {
    // A `cwd` into an app is the tell: it is how a bare `npm run build` reaches one.
    expect(script).not.toMatch(/cwd: join\(repoRoot, 'apps\//);
  });
});
