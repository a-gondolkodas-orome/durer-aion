import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { TEAM_COOKIE, TEAM_COOKIE_PATH, clearTeamCookie, requireTeam, setTeamCookie } from "./team_session";
import { configureTeamsRouter } from "./router";

const GUID = "8eae8669-125c-42e5-8b49-89afbac31679";

type TeamCtx = Parameters<ReturnType<typeof requireTeam>>[0];

function fakeCtx(cookie?: string) {
  const set = vi.fn();
  const ctx = {
    cookies: { get: () => cookie, set },
    state: {},
    status: 404,
    body: undefined,
  } as unknown as TeamCtx;
  return { ctx, set };
}

const teamsWith = (team: TeamModel | null) =>
  ({ getTeam: vi.fn().mockResolvedValue(team) }) as unknown as TeamsRepository;

// The cookie carries the team's whole access control: the flags are the point.
describe("setTeamCookie", () => {
  it("is unreadable to scripts, held back from other sites and scoped to the team routes", () => {
    const { ctx, set } = fakeCtx();

    setTeamCookie(ctx, GUID);

    expect(set).toHaveBeenCalledTimes(1);
    const [name, value, options] = set.mock.calls[0];
    expect(name).toBe(TEAM_COOKIE);
    expect(value).toBe(GUID);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: TEAM_COOKIE_PATH });
    expect(options.maxAge).toBeGreaterThan(0);
  });

  // Forcing `secure` throws over plain HTTP, and the docker stack is served
  // over plain HTTP at localhost; koa sets the flag itself behind TLS.
  it("leaves the secure flag to the connection", () => {
    const { ctx, set } = fakeCtx();

    setTeamCookie(ctx, GUID);

    expect(set.mock.calls[0][2]).not.toHaveProperty("secure");
  });
});

describe("clearTeamCookie", () => {
  it("expires the cookie under the path it was set on", () => {
    const { ctx, set } = fakeCtx(GUID);

    clearTeamCookie(ctx);

    expect(set).toHaveBeenCalledWith(TEAM_COOKIE, null, expect.objectContaining({ path: TEAM_COOKIE_PATH }));
  });
});

describe("requireTeam", () => {
  const team = { teamId: GUID } as TeamModel;

  it("answers 401 to a request with no cookie, and sets none", async () => {
    const { ctx, set } = fakeCtx();
    const next = vi.fn();

    await requireTeam(teamsWith(team))(ctx, next);

    expect(ctx.status).toBe(401);
    expect(set).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("answers 401 to a cookie naming no team, and expires it", async () => {
    const { ctx, set } = fakeCtx(GUID);
    const next = vi.fn();

    await requireTeam(teamsWith(null))(ctx, next);

    expect(ctx.status).toBe(401);
    expect(set).toHaveBeenCalledWith(TEAM_COOKIE, null, expect.anything());
    expect(next).not.toHaveBeenCalled();
  });

  it("hands the cookie's team to the route", async () => {
    const { ctx } = fakeCtx(GUID);
    const next = vi.fn();
    const teams = teamsWith(team);

    await requireTeam(teams)(ctx, next);

    expect(teams.getTeam).toHaveBeenCalledWith({ teamId: GUID });
    expect(ctx.state.team).toBe(team);
    expect(next).toHaveBeenCalledTimes(1);
  });

  // The week runs from the last request, not from the login: a team that
  // logged in early must not be logged out mid-match.
  it("sets the cookie afresh on every request it admits", async () => {
    const { ctx, set } = fakeCtx(GUID);

    await requireTeam(teamsWith(team))(ctx, vi.fn());

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(TEAM_COOKIE, GUID, expect.objectContaining({ maxAge: expect.any(Number) }));
  });
});

// Through a real koa app, because what reaches the wire is not what the
// middleware set: koa's error handler drops every header before writing an
// error, so an expiry followed by `ctx.throw` never left the server.
describe("the team routes over HTTP", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 401 is a written answer, not an error; a throw elsewhere in the
    // route would fail the test through koa's own error logging below.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, []);
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init);
  }

  it("expires a cookie naming no team on the way out", async () => {
    const request = await serve(teamsWith(null));

    const response = await request("/team/me", { headers: { cookie: `${TEAM_COOKIE}=${GUID}` } });

    expect(response.status).toBe(401);
    const expiry = response.headers.getSetCookie();
    expect(expiry).toHaveLength(1);
    expect(expiry[0]).toMatch(new RegExp(`^${TEAM_COOKIE}=; path=${TEAM_COOKIE_PATH}; expires=`));
  });

  it("logs a team in with a JSON body", async () => {
    const request = await serve(teamsWith({ teamId: GUID } as TeamModel));

    const response = await request("/team/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "000-0000-000" }),
    });

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()[0]).toMatch(new RegExp(`^${TEAM_COOKIE}=${GUID}; path=${TEAM_COOKIE_PATH};`));
  });

  // A form another site auto-submits is a top-level navigation whose answer
  // may set the cookie (login CSRF); a JSON body cannot be sent that way.
  it("refuses to log a team in from a form post", async () => {
    const teams = teamsWith({ teamId: GUID } as TeamModel);
    const request = await serve(teams);

    const response = await request("/team/join", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "code=000-0000-000",
    });

    expect(response.status).toBe(415);
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(teams.getTeam).not.toHaveBeenCalled();
  });
});
