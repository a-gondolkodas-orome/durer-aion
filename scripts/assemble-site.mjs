#!/usr/bin/env node
// Builds the GitHub Pages site into ./site — the artifact `.github/workflows/pages-deploy.yml`
// uploads. The workflow runs this script and so does `npm run site:build`, so a local preview
// is the deploy's own code rather than a lookalike that drifts from it.
//
// `npm run site:serve` then serves the result, which is the only way to see what a push to
// `main` will publish before it publishes it: the workflow going green is the cutover, with no
// staging step in between.

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The one line that moves the whole site. `/` now that gyakorlo.durerinfo.hu resolves and the
// site is served from it; it was `/durer-aion/` while it lived on the default Pages domain,
// where a project site sits under its repo name. Every subpath below is composed from it, so
// the switch stays one edit rather than one per app. See docs/pages-consolidation.md § Sequence.
const SITE_ROOT = '/';

// The custom domain, declared by pages/home/CNAME and asserted at the end.
const DOMAIN = 'gyakorlo.durerinfo.hu';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(repoRoot, 'site');

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
    env: { ...process.env, ...options.env },
  });

const step = message => console.log(`\n=== ${message}`);

step('Build strategy game practice');
run('npm', ['run', 'build'], {
  cwd: join(repoRoot, 'apps/strategy-practice'),
  env: { SITE_BASE: `${SITE_ROOT}jatekok/` },
});

step('Build the relay practice');
run('npx', ['turbo', 'build', '--filter=relay-practise-frontend'], {
  env: { SITE_BASE: `${SITE_ROOT}valto/` },
});

step('Build the competition dry run');
run('npx', ['turbo', 'build', '--filter=offline-frontend'], {
  env: { SITE_BASE: `${SITE_ROOT}proba-verseny/` },
});

// One artifact, so the layout is assembled here rather than by each app. A build failure in any
// of them blocks the whole deploy — the accepted cost of a single Pages site.
step('Assemble the site');
rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
cpSync(join(repoRoot, 'pages/home'), site, { recursive: true });
cpSync(join(repoRoot, 'apps/strategy-practice/dist'), join(site, 'jatekok'), { recursive: true });
cpSync(join(repoRoot, 'apps/relay-practise-frontend/dist'), join(site, 'valto'), { recursive: true });
cpSync(join(repoRoot, 'apps/offline-frontend/dist'), join(site, 'proba-verseny'), { recursive: true });

// The custom domain is declared by this file at the artifact root, so a deploy that shipped
// without it would quietly hand the site back to the default domain — with every path in it
// still root-absolute. Check rather than trust the copy above.
const cname = readFileSync(join(site, 'CNAME'), 'utf8').trim();
if (cname !== DOMAIN) {
  throw new Error(`site/CNAME is "${cname}", expected "${DOMAIN}"`);
}

console.log(`\nsite/ assembled for ${SITE_ROOT} — serve it with \`npm run site:serve\``);
