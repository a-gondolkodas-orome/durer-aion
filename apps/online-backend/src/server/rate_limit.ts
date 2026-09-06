import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

/** Rate limiting for the routes that answer a guess at a secret (issue #437).
 *
 * `POST /team/join` used to accept unlimited attempts at a team's join code.
 * The code is ten digits (`server/team_import.ts`), so a few thousand live
 * codes sit in ten billion — wide enough that guessing one is hopeless at
 * human speed, and not wide enough to survive a client trying continuously
 * for the length of a round. What bounds that is the attempts, not the codes.
 *
 * The counting is `rate-limiter-flexible`'s, which is where the fiddly parts
 * live: the window, the expiry, and a burst of guesses arriving at once being
 * counted rather than all passing a check none of them had reached yet. Its
 * memory store is per process, which is enough for one backend container
 * (`docker-compose.yml`); running two would double the allowance rather than
 * lose it, and the library's Postgres store is the drop-in for that day.
 *
 * Only *failed* attempts are charged, which is what makes a limit this low
 * safe: whole schools reach the site through one NAT address, and a class
 * logging in with correct codes must not lock out the next team through the
 * same router. A hundred wrong codes from one address is the thing being
 * stopped, and nothing legitimate produces those.
 */

export interface RateLimitOptions {
  /** Failed attempts allowed per window, per client. */
  limit: number;
  windowSeconds: number;
}

/** What `POST /team/join` allows one client per minute.
 *
 * Twenty is generous for typing a code in wrong — the point is the ceiling it
 * puts on a script: a day at this rate is under thirty thousand guesses
 * against ten billion codes, where the unlimited route handed out a live
 * team's round in an afternoon.
 */
export const JOIN_ATTEMPT_LIMIT = 20;
export const JOIN_ATTEMPT_WINDOW_SECONDS = 60;

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
 * in front) included. The library counts against whatever key it is given, so
 * this is the whole of what "one client" means here.
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
 * to have succeeded. A route that answers 4xx or 5xx, or one that throws —
 * which is how a missing join code is reported — keeps the charge.
 *
 * The limiter is the returned middleware's own, so two routes do not share a
 * client's budget.
 */
export function rateLimit(
  { limit, windowSeconds }: RateLimitOptions
): Router.Middleware<DefaultState, Server.AppCtx> {
  const attempts = new RateLimiterMemory({ points: limit, duration: windowSeconds });

  return async (ctx, next) => {
    const key = clientKey(ctx.ip);
    try {
      await attempts.consume(key);
    } catch (refusal) {
      // Being over the limit is how this rejects; anything else is the store
      // failing, which no route should answer as if the client were at fault.
      if (!(refusal instanceof RateLimiterRes)) throw refusal;
      ctx.set('Retry-After', `${Math.ceil(refusal.msBeforeNext / 1000)}`);
      ctx.status = 429;
      ctx.body = 'Too many attempts.';
      return;
    }

    await next();

    if (ctx.status < 400) await attempts.reward(key);
  };
}
