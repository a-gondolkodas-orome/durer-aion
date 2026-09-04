import auth from 'koa-basic-auth';
import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';

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
export const ADMIN_USER = 'admin';

export function requireAdmin(password: string): Router.Middleware<DefaultState, Server.AppCtx> {
  return auth({ name: ADMIN_USER, pass: password });
}
