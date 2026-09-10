#!/usr/bin/env node
// Publishes the testers' dry run — apps/offline-frontend — to the GitHub Pages of the year's
// PRIVATE repo. Both routes run this one script: `npm run deploy` from a maintainer's checkout,
// and the Run workflow button on .github/workflows/dry-run-deploy.yml inside that repo. One code
// path, so what CI publishes is what a maintainer can reproduce locally.
//
// The base path is derived from the repository being deployed to rather than typed in. It used to
// live in apps/offline-frontend/package.json as a `/repository-name` placeholder a maintainer
// edited and had to remember not to commit — which is how a real secret repo name once reached a
// public commit (#296).

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The public repo. Its Pages is served by pages-deploy.yml from an uploaded artifact, so a
// gh-pages branch pushed here serves nobody — but the mistake is silent, and the checkout it
// would come from is the one every contributor already has.
const PUBLIC_REPO = 'a-gondolkodas-orome/durer-aion';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(repoRoot, 'apps/offline-frontend/dist');

// Both spellings git writes, with or without the `.git` suffix: ssh remotes are
// `git@github.com:owner/repo.git`, and what actions/checkout leaves behind is
// `https://github.com/owner/repo`.
export const repoNameFromRemote = url => {
  const match = /^(?:git@[^:]+:|(?:https?|ssh):\/\/[^/]+\/)(.+?)(?:\.git)?\/?$/.exec(url.trim());
  if (!match) throw new Error(`cannot read a repository name out of the origin remote "${url}"`);
  return match[1];
};

// A trailing slash because vite's `base` needs one, and a leading one because Pages serves a
// project site under the repository name.
export const basePathFor = (remoteUrl, env = process.env) => {
  const repo = repoNameFromRemote(remoteUrl);
  if (repo === PUBLIC_REPO) {
    throw new Error(
      `refusing to deploy the dry run to ${PUBLIC_REPO}: it is the public repository, whose Pages `
      + 'is published by .github/workflows/pages-deploy.yml. Run this from a checkout of the '
      + "year's private repo."
    );
  }
  // An explicit SITE_BASE still wins, which is what makes a wrong-base bug reproducible by hand.
  return env.SITE_BASE || `/${repo.split('/').pop()}/`;
};

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
    env: { ...process.env, ...options.env },
  });

// Both tools this script runs ship a plain node script as their bin, so run them with the node
// binary already running this one. Not `npx`: on Windows that is `npx.cmd`, which node cannot exec
// without a shell (#483) — and a shell there would be worse than the disease, since cmd.exe reads
// the angle brackets in the git identity below as redirection.
const nodeRequire = createRequire(import.meta.url);

export const binOf = specifier => nodeRequire.resolve(specifier);

const runNode = (specifier, args, options = {}) =>
  run(process.execPath, [binOf(specifier), ...args], options);

const step = message => console.log(`\n=== ${message}`);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: repoRoot }).toString();
  const base = basePathFor(remote);

  // Through turbo, for the reason scripts/assemble-site.mjs gives: a bare `npm run build` inside
  // the app has no `^build` in front of it, so a workspace package it imports has no dist (#451).
  step(`Build the competition dry run for ${base}`);
  runNode('turbo/bin/turbo', ['build', '--filter=offline-frontend'], { env: { SITE_BASE: base } });

  // The private site's protection is that its github.io URL is unguessable, so it must not carry
  // a CNAME pointing it at a name anyone can type. True by construction — the site's CNAME lives
  // in pages/home/, which this build never touches — and checked so it stays true (#296).
  if (existsSync(join(dist, 'CNAME'))) {
    throw new Error(
      'apps/offline-frontend/dist/CNAME exists: a custom domain would move the dry run off the '
      + 'unguessable github.io URL that is the whole of its protection'
    );
  }

  // A runner has no git identity configured and gh-pages commits with whatever it finds, so name
  // one here rather than let the push fail on CI only.
  step(`Publish ${base} to the gh-pages branch`);
  runNode('gh-pages/bin/gh-pages.js', [
    '-d', 'apps/offline-frontend/dist',
    '-u', 'github-actions[bot] <github-actions[bot]@users.noreply.github.com>',
  ]);

  console.log(`\nthe dry run is published under ${base} — Pages serves it once the branch lands`);
}
