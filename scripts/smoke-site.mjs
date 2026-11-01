#!/usr/bin/env node
// Opens the assembled Pages site in a real browser and fails if a page does not come up. Run it
// after `npm run site:build`: it serves ./site with serve-site.mjs, the same files a push to
// `main` publishes, and checks what no other gate looks at — that the built apps load under
// their subpaths, that their chunks and assets resolve, and that nothing throws on the way.
//
// A smoke test, deliberately: each page is asserted to render one piece of its own text and no
// more, so a reworded paragraph or a moved button does not fail it. What the apps *do* is the
// unit suites' job.
//
// Third-party requests (analytics, the latex.js CDN) are aborted rather than let through, so the
// result says something about this repo's build and not about someone else's uptime.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT = 15_000;

// Hungarian throughout: the strategy and relay practice sites take `?lang=`, and the browser
// locale below covers whatever else reads navigator.language.
const PAGES = [
  { path: '/', text: 'Dürer gyakorlás' },
  {
    path: '/jatekok/?lang=hu',
    text: 'Dürer stratégiás játékok',
    // The overview is a list of links; one game page is what a visitor came for. Open the first
    // through the hash router and wait for the start button, which is strategy-game-factory's
    // own and the same for every game, so a renamed game does not fail this.
    then: async page => {
      await page.locator('a[href^="#/game/"]').first().click();
      await page.getByRole('button', { name: 'Kezdő leszek' }).waitFor({ timeout: TIMEOUT });
    },
  },
  { path: '/valto/?lang=hu', text: 'Váltók gyakorlása' },
  { path: '/proba-verseny/', text: 'Online forduló' },
];

// Console errors the aborted third-party requests cause on purpose. Anything else is a failure.
const EXPECTED_CONSOLE_ERRORS = [
  // index.html of the relay practice and the dry run, when cdn.jsdelivr.net is unreachable.
  /^latex\.js could not be loaded/,
];

// Claude Code's cloud container and the devcontainer bake a Chromium of their own, which need not
// be the revision the pinned playwright looks for; this points the launch at it.
const launchBrowser = () => {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  return chromium.launch(executablePath ? { executablePath } : {});
};

const startServer = () =>
  new Promise((resolvePromise, reject) => {
    const server = spawn(process.execPath, [join(repoRoot, 'scripts/serve-site.mjs')], {
      env: { ...process.env, PORT: '0' },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    server.on('error', reject);
    server.on('exit', code => reject(new Error(`serve-site.mjs exited with ${code} before listening`)));
    let output = '';
    server.stdout.on('data', chunk => {
      output += chunk;
      const url = /site\/ on (http:\/\/\S+?)\/?\s/.exec(output)?.[1];
      if (url) resolvePromise({ url, stop: () => server.kill() });
    });
  });

// Everything that went wrong on one page, as lines of a report.
const checkPage = async (context, origin, { path, text, then }) => {
  const problems = [];
  const sameOrigin = url => url.startsWith(origin);
  const page = await context.newPage();

  // A missing script is reported three times over — its 404, the request failing, and the
  // browser's console line about it — so each URL counts once, and the console's resource
  // errors are left to the two network handlers, which name the URL.
  const failedUrls = new Set();
  const failedRequest = (url, why) => {
    if (sameOrigin(url) && !failedUrls.has(url)) {
      failedUrls.add(url);
      problems.push(`${why}: ${url}`);
    }
  };

  page.on('pageerror', error => problems.push(`uncaught: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error' || message.text().startsWith('Failed to load resource')) return;
    if (EXPECTED_CONSOLE_ERRORS.some(pattern => pattern.test(message.text()))) return;
    problems.push(`console error: ${message.text()}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) failedRequest(response.url(), `HTTP ${response.status()}`);
  });
  page.on('requestfailed', request => failedRequest(request.url(), request.failure()?.errorText ?? 'failed'));

  try {
    const response = await page.goto(origin + path, { waitUntil: 'networkidle', timeout: TIMEOUT });
    if (!response?.ok()) problems.push(`HTTP ${response?.status()} for the page itself`);
    await page.getByText(text).first().waitFor({ timeout: TIMEOUT });
    if (then) await then(page);

    // Links between the apps are relative and depend on where each is mounted, so a moved
    // subpath breaks them without breaking any page. Same-origin, non-hash links only: a hash
    // link stays on the page just loaded.
    const targets = await page.locator('a[href]').evaluateAll(links => links.map(link => link.href));
    for (const href of new Set(targets)) {
      if (!sameOrigin(href) || new URL(href).hash) continue;
      const linked = await page.request.get(href);
      if (!linked.ok()) problems.push(`link to ${href} answers HTTP ${linked.status()}`);
    }
  } catch (error) {
    problems.push(error.message.split('\n')[0]);
  } finally {
    await page.close();
  }
  return problems;
};

if (!existsSync(join(repoRoot, 'site/index.html'))) {
  console.error('site/ is not built — run `npm run site:build` first.');
  process.exit(1);
}

const server = await startServer();
const browser = await launchBrowser();
let failed = false;
try {
  const context = await browser.newContext({ locale: 'hu-HU' });
  await context.route(url => !url.href.startsWith(server.url), route => route.abort());
  for (const page of PAGES) {
    const problems = await checkPage(context, server.url, page);
    failed ||= problems.length > 0;
    console.log(`${problems.length ? '✗' : '✓'} ${page.path}`);
    for (const problem of problems) console.log(`    ${problem}`);
  }
} finally {
  await browser.close();
  server.stop();
}
process.exit(failed ? 1 : 0);
