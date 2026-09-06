import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { isIPv6 } from 'node:net';
import { Address6 } from 'ip-address';
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

/** How much of an IPv6 address counts as one client.
 *
 * A single subscriber is handed a whole prefix — commonly a /56, sometimes a
 * /48 — so counting per address would let one client have as many buckets as
 * it cared to use. /56 is what `express-rate-limit` settled on for the same
 * problem. It can put two subscribers of the same ISP in one bucket, which is
 * cheap here precisely because only wrong codes are charged.
 */
const IPV6_CLIENT_PREFIX = 56;

/** The client a bucket belongs to.
 *
 * `ctx.ip` is the first `X-Forwarded-For` entry once `app.proxy` is set
 * (`server.ts`), and nginx overwrites that header with the address that
 * connected to it (`apps/online-frontend/nginx/nginx.conf`) rather than
 * appending to what the client sent — otherwise a client would pick its own
 * bucket by sending a header, and the limit would count nothing.
 *
 * Parsing is `ip-address`', not this file's: an address has more spellings
 * than are worth re-deriving here — upper case, `::` in any position, a zone
 * id, and the `::ffff:` form a dual-stack socket reports with no proxy in
 * front — and every spelling that reaches a different key is a bucket the
 * same client did not have to spend.
 */
export function clientKey(ip: string): string {
  if (!isIPv6(ip)) return ip;
  const address = new Address6(ip);
  if (address.isMapped4()) return address.to4().correctForm();
  return new Address6(`${ip}/${IPV6_CLIENT_PREFIX}`).networkForm();
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
