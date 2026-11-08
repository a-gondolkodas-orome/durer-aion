// The two `X-Forwarded-*` headers `apps/online-frontend/nginx/nginx.conf` sets are load-bearing,
// and losing either one fails silently — the stack comes up, a round plays, and what breaks only
// shows under a competition's worth of traffic:
//
// - `X-Forwarded-Proto $scheme` is how the backend learns the browser spoke HTTPS, and the team's
//   session cookie takes its `Secure` flag from that (team_session.ts).
// - `X-Forwarded-For $remote_addr` is the client the join-code attempt limit counts against
//   (rate_limit.ts). Without it every team shares nginx's one allowance, and twenty mistyped codes
//   lock the whole field out.
//
// Neither is reachable from a unit test of the backend, and the docker CI job builds the image
// without starting one. nginx does not inherit `proxy_set_header` into a location that sets one of
// its own, as /socket.io/ does, so every proxied location repeats the pair: the counts must match.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const configPath = 'apps/online-frontend/nginx/nginx.conf';
// Comments stripped: a directive quoted in one is not a directive. No value here contains a `#`.
const directives = readFileSync(fileURLToPath(new URL(`../../${configPath}`, import.meta.url)), 'utf8')
  .replace(/#.*$/gm, '');
const count = pattern => directives.match(new RegExp(pattern, 'g'))?.length ?? 0;

describe(configPath, () => {
  it('passes the client\'s address and the browser\'s scheme on from every proxied location', () => {
    const proxied = count(String.raw`\bproxy_pass\s`);

    expect(proxied, 'no proxy_pass found: is the backend still proxied from here?').toBeGreaterThan(0);
    expect(count(String.raw`proxy_set_header\s+X-Forwarded-For\s+\$remote_addr;`), 'X-Forwarded-For $remote_addr').toBe(proxied);
    expect(count(String.raw`proxy_set_header\s+X-Forwarded-Proto\s+\$scheme;`), 'X-Forwarded-Proto $scheme').toBe(proxied);
  });

  // `$proxy_add_x_forwarded_for` appends to the header the client sent, leaving a forged address
  // first — and koa reads the first, so every client could pick its own rate-limit bucket. It is
  // the spelling most nginx examples use, so it is the likely way the header comes back wrong.
  it('does not append to the address the client claimed', () => {
    expect(directives).not.toContain('$proxy_add_x_forwarded_for');
  });
});
