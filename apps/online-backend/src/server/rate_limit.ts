import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { isIPv6 } from 'node:net';
import { Address6 } from 'ip-address';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

/** Rate limiting for the routes that answer a guess at a secret (issues #437,
 * #719): the join code on `POST /team/join`, and the organisers' password on
 * every admin route (`admin_session.ts`).
 *
 * `POST /team/join` answers a guess at a team's join code, so what it needs is
 * a ceiling on the attempts. The code is ten digits (`server/team_import.ts`),
 * so a few thousand live codes sit in ten billion — wide enough that guessing
 * one is hopeless at human speed, and not wide enough to survive a client
 * trying continuously for the length of a round. What bounds that is the
 * attempts, not the codes.
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

/** Wrong admin passwords allowed one client per quarter hour, across all the
 * admin routes together.
 *
 * Lower than the join limit, and over a longer window: the password is one
 * secret guarding every team's join code, the only people who should be typing
 * it are a handful of organisers, and a mistyped password costs them nothing
 * until the tenth time.
 */
export const ADMIN_ATTEMPT_LIMIT = 10;
export const ADMIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;

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

/** A client's budget of failed attempts, for a middleware that decides for
 * itself what counts as one — `rateLimit` below, and the admin login.
 *
 * The limiter is the returned object's own, so two callers do not share a
 * client's budget.
 */
export function attemptLimiter({ limit, windowSeconds }: RateLimitOptions) {
  const attempts = new RateLimiterMemory({ points: limit, duration: windowSeconds });

  return {
    /** Charges one attempt, or answers 429 and returns false when the client
     * has none left.
     *
     * Written rather than thrown: koa's error handler drops every header set
     * before an error, `Retry-After` with them. */
    async charge(ctx: Server.AppCtx): Promise<boolean> {
      try {
        await attempts.consume(clientKey(ctx.ip));
        return true;
      } catch (refusal) {
        // Being over the limit is how this rejects; anything else is the store
        // failing, which no route should answer as if the client were at fault.
        if (!(refusal instanceof RateLimiterRes)) throw refusal;
        ctx.set('Retry-After', `${Math.ceil(refusal.msBeforeNext / 1000)}`);
        ctx.status = 429;
        ctx.body = 'Too many attempts.';
        return false;
      }
    },

    /** Gives back the attempt `charge` took, once it turned out not to be a
     * failed guess. */
    async refund(ctx: Server.AppCtx): Promise<void> {
      await attempts.reward(clientKey(ctx.ip));
    },
  };
}

/** Answers 429 to a client that has spent its window's attempts.
 *
 * The attempt is charged before the route runs and given back if it turns out
 * to have succeeded. A route that answers 4xx or 5xx, or one that throws —
 * which is how a missing join code is reported — keeps the charge.
 */
export function rateLimit(options: RateLimitOptions): Router.Middleware<DefaultState, Server.AppCtx> {
  const attempts = attemptLimiter(options);

  return async (ctx, next) => {
    if (!(await attempts.charge(ctx))) return;

    await next();

    if (ctx.status < 400) await attempts.refund(ctx);
  };
}
