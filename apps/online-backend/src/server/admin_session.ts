import auth from 'koa-basic-auth';
import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';

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
 * `admin_session.test.ts` pins both halves: the case-folded paths answer 401,
 * and no route under either prefix is registered without this middleware.
 */
export function requireAdmin(password: string): Router.Middleware<DefaultState, Server.AppCtx> {
  return auth({ name: ADMIN_USER, pass: password });
}

/** Admits a TSV body only, for the team import.
 *
 * A content type rather than a shape check: it is also what keeps another site
 * from posting an import. `text/tab-separated-values` cannot be set by a form,
 * and a cross-site `fetch` that sets it triggers a CORS preflight, which this
 * server does not grant. `requireJson` in `team_session.ts` closes the login routes the
 * same way and says more about why.
 *
 * The admin routes are behind Basic auth, whose credentials a browser will
 * attach to a cross-site request of its own accord — so the guard is doing
 * work here, not just describing the body.
 */
export const requireTsv: Router.Middleware<DefaultState, Server.AppCtx> = async (ctx, next) => {
  if (!ctx.is('text/tab-separated-values')) {
    ctx.throw(415, 'Expected text/tab-separated-values.');
  }
  await next();
};
