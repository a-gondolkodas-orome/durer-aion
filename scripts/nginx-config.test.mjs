// The two `X-Forwarded-*` headers `apps/online-frontend/nginx/nginx.conf` sets are load-bearing,
// and losing either one fails silently — the stack comes up, a round plays, and what breaks only
// shows under a competition's worth of traffic:
//
// - `X-Forwarded-Proto $scheme` is how the backend learns the browser spoke HTTPS, and the team's
//   session cookie takes its `Secure` flag from that (`server/team_session.ts`). Without it the
//   cookie ships in the clear while everything appears to work.
// - `X-Forwarded-For $remote_addr` is the client the join-code attempt limit counts against
//   (`server/rate_limit.ts`). Without it `ctx.ip` falls back to the address that connected, which
//   is this nginx — so every team in the competition shares one 20-a-minute allowance, and the
//   first twenty mistyped codes lock the whole field out with a message blaming teams that typed
//   nothing wrong.
//
// Neither is reachable from a unit test of the backend, and the docker CI job builds the image
// without starting one, so nothing above this file reads the config at all. It is the same kind of
// gap `workflow-safety.test.mjs` and `socketio-single-copy.test.mjs` cover: a tracked file that
// decides production behaviour and that no running test loads.
//
// The questions are asked of *every* proxied location rather than of the four that exist today, so
// a location added later is covered the day it lands.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const configPath = 'apps/online-frontend/nginx/nginx.conf';
const config = readFileSync(fileURLToPath(new URL(`../${configPath}`, import.meta.url)), 'utf8');

// Comments are stripped first: a directive quoted in one of them is not a directive, and the file
// carries several. No value in this config contains a `#`, which is the only thing this would
// otherwise get wrong.
const directives = config.replace(/#.*$/gm, '');

/** Every `location` block in the file, as `{ path, body }`, with nested blocks kept in the body. */
function locationBlocks(text) {
  const blocks = [];
  const opener = /location\s+([^\s{]+(?:\s+[^\s{]+)*?)\s*\{/g;
  for (let match = opener.exec(text); match; match = opener.exec(text)) {
    let depth = 1;
    let end = opener.lastIndex;
    while (depth > 0 && end < text.length) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
      end++;
    }
    blocks.push({ path: match[1], body: text.slice(opener.lastIndex, end - 1) });
  }
  return blocks;
}

/** What `proxy_set_header <name>` is set to in this block, or undefined if it is not set. */
const headerValue = (body, name) =>
  new RegExp(`proxy_set_header\\s+${name}\\s+(\\S+?);`, 'i').exec(body)?.[1];

describe(configPath, () => {
  const proxied = locationBlocks(directives).filter(({ body }) => /proxy_pass\s/.test(body));

  // Without this the file could stop matching the parser above — a rename, a reformat — and every
  // assertion below would pass over an empty list.
  it('has locations that proxy to the backend', () => {
    expect(
      proxied.map(({ path }) => path),
      `No \`location\` block in ${configPath} contains a proxy_pass. Either the backend is no `
      + 'longer proxied from here, or this test stopped finding the blocks it is meant to check.'
    ).toContain('/team');
  });

  it.each(proxied.map(({ path, body }) => [path, body]))(
    'location %s passes the client\'s address on',
    (path, body) => {
      expect(
        headerValue(body, 'X-Forwarded-For'),
        `location ${path} does not set X-Forwarded-For. The backend then counts every team's `
        + 'join-code attempts against this nginx instead, so one team\'s mistypes refuse the '
        + 'whole competition — see apps/online-backend/src/server/rate_limit.ts.'
      ).toBe('$remote_addr');
    }
  );

  it.each(proxied.map(({ path, body }) => [path, body]))(
    'location %s passes the browser\'s scheme on',
    (path, body) => {
      expect(
        headerValue(body, 'X-Forwarded-Proto'),
        `location ${path} does not set X-Forwarded-Proto. The team's session cookie loses its `
        + 'Secure flag — see apps/online-backend/src/server/team_session.ts.'
      ).toBe('$scheme');
    }
  );

  // `$proxy_add_x_forwarded_for` appends to the header the client sent, which leaves a forged
  // address first in the list — and koa reads the first one, so every client could pick its own
  // bucket and the limit would count nothing. It is the spelling most nginx examples use, so this
  // is the likely way the header comes back wrong rather than missing.
  it('does not append to the address the client claimed', () => {
    expect(
      directives,
      `${configPath} uses $proxy_add_x_forwarded_for. koa reads the first entry of `
      + 'X-Forwarded-For, so appending lets a client choose the bucket its join-code attempts are '
      + 'counted in. There is no proxy in front of this one whose header would be worth keeping.'
    ).not.toContain('$proxy_add_x_forwarded_for');
  });
});
