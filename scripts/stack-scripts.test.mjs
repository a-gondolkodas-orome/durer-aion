// The stack scripts are the commands README.md and DEPLOYMENT.md tell a developer and an
// operator to run, and each one is a chain of steps in a string that nothing else checks.
// What is pinned here is the order and the file set those chains have to keep, because
// getting either wrong fails somewhere else entirely: a bundle built before the env files
// were looked at, or a teardown reaching for a compose file the deployment does not have.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const scripts = () => JSON.parse(readFileSync(`${repoRoot}package.json`, 'utf8')).scripts;

// Every script rather than the `stack:*` ones alone, so one added later is covered the day
// it lands.
const scriptsMatching = (pattern) =>
  Object.entries(scripts()).filter(([, body]) => pattern.test(body));

describe('the env files', () => {
  // A frontend's values are inlined into its bundle at build time, and `docker compose
  // --env-file` reads `.env.docker` before it starts anything — so both of these need the
  // files to be there, and a script that finds out afterwards has already built the wrong
  // bundle. `stack:build` is left out: it builds images from the context and inlines
  // nothing, and CI seeds the files itself before running it.
  const BUILDS_A_BUNDLE_OR_STARTS_THE_STACK = /turbo build[^&]*frontend|docker compose[^&]*\bup\b/;
  // `prepare.mjs` writes the missing ones from their samples, which is what a developer
  // wants; `--check` only reports them, which is what a deployment wants. Either answers
  // the question before the build.
  const LOOKS_AT_THEM = /scripts\/prepare\.mjs|npm run env:check/;

  it.each(scriptsMatching(BUILDS_A_BUNDLE_OR_STARTS_THE_STACK))(
    '%s looks at them before it builds or starts anything',
    (_name, body) => {
      const looked = body.search(LOOKS_AT_THEM);
      const built = body.search(BUILDS_A_BUNDLE_OR_STARTS_THE_STACK);

      expect(looked).toBeGreaterThanOrEqual(0);
      expect(looked).toBeLessThan(built);
    }
  );
});

describe('the dev overlay', () => {
  // Teardown, logs and `ps` find the containers by the project name docker compose derives
  // from this directory, so they need the service names and nothing else — while
  // `docker-compose.dev.yml` is what replaces the backend's command with the watcher and
  // publishes postgres on loopback. `stack:down` composed it and `stack:prod`, `stack:logs`
  // and `stack:ps` did not, which left a production operator running DEPLOYMENT.md's
  // `npm run stack:down -- --volumes` against a different file set than the one they
  // brought up.
  const OVERLAY = /docker-compose\.dev\.yml/;

  it('is composed by stack:up alone', () => {
    expect(scriptsMatching(OVERLAY).map(([name]) => name)).toStrictEqual(['stack:up']);
  });
});
