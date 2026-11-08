import auth from 'koa-basic-auth';
import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { ADMIN_ATTEMPT_LIMIT, ADMIN_ATTEMPT_WINDOW_SECONDS, attemptLimiter } from './rate_limit';

/** The one account the organisers' password belongs to. */
export const ADMIN_USER = 'admin';

/** The organisers' login for the `/team/admin` and `/game/admin` routes.
 *
 * HTTP Basic, one shared password from `ADMIN_CREDENTIALS`. `koa-basic-auth`
 * compares through `tsscmp`, so the check does not leak the password's prefix
 * in its timing.
 *
 * The middleware is attached to each admin route, not mounted on the path they
 * share, because a mount is a *second* matcher and the two disagreed: koa-mount
 * tests its prefix with a plain `indexOf`, which is case-sensitive, while
 * `@koa/router` matches routes case-insensitively unless told otherwise. So
 * `GET /team/ADMIN/all` used to miss the mount and hit the route — every team's
 * join code, served to anyone who asked. Hanging the check on the route itself
 * means there is only one matcher, and it cannot disagree with itself.
 *
 * Wrong passwords are limited per client, one budget across every admin
 * route — `rate_limit.ts` for the numbers. What is charged is a request that
 * sent credentials and failed them. A request that sent none is not a guess:
 * it is how the browser learns to ask, so it gets its challenge uncharged. And
 * the charge is given back the moment the password checks out, before the
 * route runs, so an organiser's own 404 or 400 never counts against them. A
 * client over its limit is refused even with the right password — answering
 * that one would tell a guesser which guess was right.
 *
 * `admin_session.test.ts` pins both halves: the case-folded paths answer 401,
 * and no route under either prefix is registered without this middleware.
 */
export function requireAdmin(password: string): Router.Middleware<DefaultState, Server.AppCtx> {
  const check = auth({ name: ADMIN_USER, pass: password });
  const attempts = attemptLimiter({ limit: ADMIN_ATTEMPT_LIMIT, windowSeconds: ADMIN_ATTEMPT_WINDOW_SECONDS });

  return async (ctx, next) => {
    if (!ctx.get('authorization')) return check(ctx, next);
    if (!(await attempts.charge(ctx))) return;
    await check(ctx, async () => {
      await attempts.refund(ctx);
      await next();
    });
  };
}
