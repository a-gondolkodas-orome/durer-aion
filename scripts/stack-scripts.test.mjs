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
  // The `npm run` spelling and the direct one both count: which of the two a chain uses
  // is a choice about readability, and a test that accepted only one would be rejecting
  // a correct script for writing itself out.
  const LOOKS_AT_THEM = /scripts\/prepare\.mjs|npm run env:check|seed-env-files\.mjs[^&]*--check/;

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

describe('every deployed service', () => {
  // `up --wait` is what `stack:up` and `stack:prod` end on, and it waits for a healthy
  // container only where there is a healthcheck to be healthy by; everywhere else it
  // settles for "the process started". nginx restart-looping on a mounted TLS snippet and
  // a turbo watcher that kept its packages alive after the server task died are both
  // containers that pass "started", so the answer is that every service has one rather
  // than the two that have been caught being wrong.
  const services = () => {
    const lines = readFileSync(`${repoRoot}docker-compose.yml`, 'utf8').split('\n');
    const found = new Map();
    // The file's other top-level key is `volumes:`, whose entries are indented like a
    // service and are not one, so this follows the block rather than the indentation.
    let inServices = false;
    let current = null;
    for (const line of lines) {
      // A comment is not a key at any column. Reading one in the first column as the end
      // of the services block would drop every service after it, and the assertion below
      // would then pass on what was left.
      if (/^\s*#/.test(line)) {
        continue;
      } else if (/^\S/.test(line)) {
        inServices = line.startsWith('services:');
        current = null;
      } else if (!inServices) {
        continue;
      } else if (/^ {2}\S+:\s*$/.test(line)) {
        current = line.trim().slice(0, -1);
        found.set(current, false);
      } else if (current && /^ {4}healthcheck:/.test(line)) {
        found.set(current, true);
      }
    }
    return found;
  };

  // Written out rather than counted, because the reading above is a handful of regexes
  // and not a YAML parser: anything it stops recognising — a service written
  // `web: {…}` on one line, a shape nobody has used here yet — would otherwise take
  // that service out of the check silently, which is the one way this test could report
  // success for a stack it never looked at. Adding a service means adding it here, and
  // then the healthcheck question is asked of it.
  it('is one of the three this file defines', () => {
    expect([...services().keys()]).toStrictEqual(['web', 'backend', 'postgres']);
  });

  it('is one `up --wait` can wait for', () => {
    const withoutOne = [...services()].filter(([, has]) => !has).map(([name]) => name);

    expect(withoutOne).toStrictEqual([]);
  });
});
