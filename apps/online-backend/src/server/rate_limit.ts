import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';

/** Rate limiting for the routes that answer a guess at a secret (issue #437).
 *
 * `POST /team/join` used to accept unlimited attempts at a team's join code.
 * The code is ten digits (`server/team_import.ts`), so a few thousand live
 * codes sit in ten billion — wide enough that guessing one is hopeless at
 * human speed, and not wide enough to survive a client trying continuously
 * for the length of a round. What bounds that is the attempts, not the codes.
 *
 * A fixed window, counted in memory. In memory is enough because there is one
 * backend process (`docker-compose.yml`); a second one would multiply the
 * allowance rather than lose it, which is when the counter would have to move
 * to Postgres.
 *
 * Only *failed* attempts are charged, which is what makes a limit this low
 * safe: whole schools reach the site through one NAT address, and a class
 * logging in with correct codes must not lock out the next team through the
 * same router. A hundred wrong codes from one address is the thing being
 * stopped, and nothing legitimate produces those.
 */

interface Bucket {
  charged: number;
  /** When the window ends; the bucket is dead to every request from then on. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Failed attempts allowed per window, per client. */
  limit: number;
  windowMs: number;
  /** The clock, so a test does not have to wait a window out. */
  now?: () => number;
}

/** What `POST /team/join` allows one client per minute.
 *
 * Twenty is generous for typing a code in wrong — the point is the ceiling it
 * puts on a script: a day at this rate is under thirty thousand guesses
 * against ten billion codes, where the unlimited route handed out a live
 * team's round in an afternoon.
 */
export const JOIN_ATTEMPT_LIMIT = 20;
export const JOIN_ATTEMPT_WINDOW_MS = 60 * 1000;

/** Expands an IPv6 address's `::` and keeps the first four groups. */
function ipv6Network(ip: string): string {
  const [head, tail] = ip.split('::');
  const groups = (part: string | undefined) => (part ? part.split(':') : []);
  const before = groups(head);
  const after = groups(tail);
  const zeroes: string[] =
    tail === undefined ? [] : Array<string>(Math.max(0, 8 - before.length - after.length)).fill('0');
  return [...before, ...zeroes, ...after].slice(0, 4).join(':');
}

/** The client a bucket belongs to.
 *
 * `ctx.ip` is the first `X-Forwarded-For` entry once `app.proxy` is set
 * (`server.ts`), and nginx overwrites that header with the address that
 * connected to it (`apps/online-frontend/nginx/nginx.conf`) rather than
 * appending to what the client sent — otherwise a client would pick its own
 * bucket by sending a header, and the limit would count nothing.
 *
 * An IPv6 client is usually given a whole /64 to itself, so its address alone
 * would hand it as many buckets as it cares to use: everything after the
 * fourth group is dropped. An IPv4 address is one client, mapped form
 * (`::ffff:1.2.3.4`, which is what a dual-stack socket reports with no proxy
 * in front) included.
 */
export function clientKey(ip: string): string {
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1);
  if (!ip.includes(':')) return ip;
  return ipv6Network(ip);
}

/** Answers 429 to a client that has spent its window's attempts.
 *
 * Written rather than thrown: koa's error handler drops every header set
 * before an error, `Retry-After` with them.
 *
 * The attempt is charged before the route runs and given back if it turns out
 * to have succeeded. That order is what makes the count hold under load:
 * charging afterwards would let any number of guesses sent at once all pass
 * the check, none of them counted yet, and a client could then spend a whole
 * window's allowance on every burst. A route that answers 4xx or 5xx, or one
 * that throws — which is how a missing join code is reported — keeps the
 * charge.
 *
 * The state is the returned middleware's own, so two routes do not share a
 * client's budget.
 */
export function rateLimit(
  { limit, windowMs, now = Date.now }: RateLimitOptions
): Router.Middleware<DefaultState, Server.AppCtx> {
  const buckets = new Map<string, Bucket>();

  /* A bucket lives one window, but only a request from that same client throws
   * it away, so the map would otherwise keep an entry per address ever seen.
   * The sweep runs at a size no real round reaches, which keeps it off the
   * path a competition actually takes. */
  const SWEEP_AT = 10_000;

  return async (ctx, next) => {
    const at = now();
    const key = clientKey(ctx.ip);
    const previous = buckets.get(key);
    const bucket = previous && previous.resetAt > at ? previous : { charged: 0, resetAt: at + windowMs };

    if (bucket.charged >= limit) {
      ctx.set('Retry-After', `${Math.ceil((bucket.resetAt - at) / 1000)}`);
      ctx.status = 429;
      ctx.body = 'Too many attempts.';
      return;
    }

    if (bucket !== previous) {
      if (buckets.size >= SWEEP_AT) {
        for (const [seen, expiring] of buckets) {
          if (expiring.resetAt <= at) buckets.delete(seen);
        }
      }
      buckets.set(key, bucket);
    }
    bucket.charged += 1;

    await next();

    if (ctx.status < 400) bucket.charged -= 1;
  };
}
