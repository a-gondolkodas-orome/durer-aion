import type * as Router from '@koa/router';
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
 *   `app.proxy = true` in `server.ts` honours and `nginx.conf` forwards.
 * - A week's lifetime: the localStorage entry it replaces never expired, and a
 *   team that logs in the evening before to read the disclaimer must still be
 *   logged in for the round.
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
 * A cookie naming no team — deleted, or a database re-imported since the
 * login — is expired on the way out, so the browser does not keep sending it.
 */
export function requireTeam(teams: TeamsRepository): Router.Middleware<TeamState, Server.AppCtx> {
  return async (ctx, next) => {
    const teamId = ctx.cookies.get(TEAM_COOKIE) ?? ctx.throw(401, 'Not logged in.');
    const team = await teams.getTeam({ teamId });
    if (!team) {
      clearTeamCookie(ctx);
    }
    ctx.state.team = team ?? ctx.throw(401, 'Not logged in.');
    await next();
  };
}
