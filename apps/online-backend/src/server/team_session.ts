import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { TeamsRepository } from './db';
import { TeamModel } from './model';

/** The team's session: its GUID in an HttpOnly cookie (issue #89).
 *
 * The GUID is the team's whole access control, so where it travels matters
 * more than what it is. It used to be a path segment of every team route and
 * a localStorage entry — access logs, browser history, the `Referer` header,
 * and any script on the page could read it. Here it is a cookie that only the
 * `/team/me` routes ever receive:
 *
 * - `httpOnly`: no script on the page can read it, so an XSS is not an
 *   account takeover.
 * - `sameSite: 'lax'`: the browser does not attach it to requests other sites
 *   make, and every state-changing team route is a POST — together that is
 *   the CSRF protection.
 * - `path: '/team/me'`: the only routes that read it; it is never sent to
 *   the boardgame.io routes, the socket, or the admin routes.
 * - `secure` is deliberately not set: koa's cookies library adds it on its own
 *   when the request came over HTTPS, and *forcing* it over plain HTTP throws,
 *   which would break login on the docker stack at `http://localhost`. Behind
 *   nginx the request only looks like HTTPS through `X-Forwarded-Proto`, which
 *   `nginx.conf` sets from its own scheme and `app.proxy = true` in `server.ts`
 *   honours.
 * - A week's lifetime, from the last request rather than from the login:
 *   `requireTeam` sets the cookie afresh on every request it admits. The
 *   localStorage entry it replaces never expired, and a team that logs in
 *   the evening before to read the disclaimer must still be logged in for
 *   the round — and one that logged in a week earlier must not find itself
 *   logged out mid-match.
 *
 * The GUID stays an opaque, unguessable value looked up in the database on
 * every request, as it was in the URL — no signing, no secret to configure.
 */
export const TEAM_COOKIE = 'durer_team';
export const TEAM_COOKIE_PATH = '/team/me';
export const TEAM_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setTeamCookie(ctx: Server.AppCtx, teamId: string) {
  ctx.cookies.set(TEAM_COOKIE, teamId, {
    httpOnly: true,
    sameSite: 'lax',
    path: TEAM_COOKIE_PATH,
    maxAge: TEAM_COOKIE_MAX_AGE_MS,
    overwrite: true,
  });
}

/** Expires the cookie: the browser matches it by name and path. */
export function clearTeamCookie(ctx: Server.AppCtx) {
  ctx.cookies.set(TEAM_COOKIE, null, {
    httpOnly: true,
    sameSite: 'lax',
    path: TEAM_COOKIE_PATH,
  });
}

export interface TeamState {
  team: TeamModel;
}

/** Loads the team the cookie names into `ctx.state.team`, or answers 401.
 *
 * A team it admits gets its cookie set again, so the week runs from the
 * last request (see above).
 * A cookie naming no team — deleted, or a database re-imported since the
 * login — is expired on the way out, so the browser does not keep sending it.
 * That answer is written, not thrown: koa's default error handler strips every
 * header already set before it writes the error, `Set-Cookie` included, so a
 * `ctx.throw(401)` after `clearTeamCookie` would silently keep the cookie.
 */
export function requireTeam(teams: TeamsRepository): Router.Middleware<TeamState, Server.AppCtx> {
  return async (ctx, next) => {
    const teamId = ctx.cookies.get(TEAM_COOKIE);
    const team = teamId ? await teams.getTeam({ teamId }) : null;
    if (!team) {
      if (teamId !== undefined) {
        clearTeamCookie(ctx);
      }
      ctx.status = 401;
      ctx.body = 'Not logged in.';
      return;
    }
    ctx.state.team = team;
    setTeamCookie(ctx, team.teamId);
    await next();
  };
}

/** Admits a JSON body only, for the login route.
 *
 * The cookie's `SameSite` limits when it is *sent*, not when it is *set*: a
 * form another site auto-submits to `/team/join` is a top-level navigation,
 * whose answer may set the cookie — logging this browser into a team of that
 * site's choosing. A JSON content type cannot be sent cross-site without a
 * CORS preflight, which the server does not grant, so requiring it closes that.
 */
export const requireJson: Router.Middleware<DefaultState, Server.AppCtx> = async (ctx, next) => {
  if (!ctx.is('json')) {
    ctx.throw(415, 'Expected application/json.');
  }
  await next();
};
