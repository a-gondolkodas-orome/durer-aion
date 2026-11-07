import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { ADMIN_ATTEMPT_LIMIT } from "./rate_limit";

const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

const columns = {
  teamId: "8eae8669-125c-42e5-8b49-89afbac31679",
  joinCode: "000-0000-000",
  credentials: "secret-token",
  email: "team@example.com",
  relayMatchID: null,
  strategyMatchID: null,
};
const team = { ...columns, toJSON: () => columns } as unknown as TeamModel;

const WRONG = `Basic ${Buffer.from(`${ADMIN_USER}:not-the-password`).toString("base64")}`;

const teamsWith = (rows: TeamModel[]) =>
  ({ listTeams: vi.fn().mockResolvedValue(rows) }) as unknown as TeamsRepository;

// Both halves of this file are one regression: the admin login used to be
// mounted on `/team/admin` and `/game/admin` while the routes underneath it
// matched case-insensitively, so `GET /team/ADMIN/all` missed the mount and
// answered with every team's join code. See server/admin_session.ts.
describe("the admin routes over HTTP", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 401 is what this file is about, and koa logs every error it writes.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init);
  }

  it("serves the teams to the organisers", async () => {
    const request = await serve(teamsWith([team]));

    const response = await request("/team/admin/all", { headers: { authorization: CREDENTIALS } });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual([
      { ...columns, relayMatch: { state: "NOT STARTED" }, strategyMatch: { state: "NOT STARTED" } },
    ]);
  });

  // The challenge is what makes the browser ask, which is the whole of the
  // admin page's login. koa's error handler drops headers set before an error
  // but re-applies the ones the error itself carries, which is where
  // koa-basic-auth puts this one.
  it("refuses a request with no password, and asks for one", async () => {
    const teams = teamsWith([team]);
    const request = await serve(teams);

    const response = await request("/team/admin/all");

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toMatch(/^Basic realm=/);
    expect(teams.listTeams).not.toHaveBeenCalled();
  });

  // The routes match case-insensitively, so every casing of the path has to
  // ask for the password. A join code is a team's whole login.
  it.each(["/team/ADMIN/all", "/team/Admin/all", "/TEAM/ADMIN/ALL"])(
    "refuses %s, which the routes still match",
    async (path) => {
      const teams = teamsWith([team]);
      const request = await serve(teams);

      const response = await request(path);

      expect(response.status).toBe(401);
      expect(await response.text()).not.toContain(team.joinCode);
      expect(teams.listTeams).not.toHaveBeenCalled();
    }
  );

  it("refuses a case-folded match route as well", async () => {
    const request = await serve(teamsWith([]));

    expect((await request("/game/ADMIN/some-match/state")).status).toBe(401);
  });
});

// Issue #719: the password is one secret guarding every team's join code, so
// guessing at it is limited like guessing at a join code is.
describe("guessing the admin password", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // Every refusal below is an error koa would log.
    app.silent = true;
    // No match exists, so the match routes answer 404 to the organisers.
    app.context.db = { fetch: () => Promise.resolve({}) } as unknown as Server.AppCtx["db"];
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (path: string, authorization?: string) =>
      fetch(`http://127.0.0.1:${port}${path}`, authorization ? { headers: { authorization } } : undefined);
  }

  async function spendAttempts(request: Awaited<ReturnType<typeof serve>>) {
    for (let i = 0; i < ADMIN_ATTEMPT_LIMIT; i++) {
      expect((await request("/team/admin/all", WRONG)).status).toBe(401);
    }
  }

  // Refused even with the right password: answering it would tell a guesser
  // which of their guesses was the one.
  it("stops guessing at the limit, the right password included", async () => {
    const teams = teamsWith([team]);
    const request = await serve(teams);

    await spendAttempts(request);
    const refused = await request("/team/admin/all", CREDENTIALS);

    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(teams.listTeams).not.toHaveBeenCalled();
  });

  it("counts every admin route against one budget", async () => {
    const request = await serve(teamsWith([]));

    await spendAttempts(request);

    expect((await request("/game/admin/some-match/state", WRONG)).status).toBe(429);
  });

  // A request with no credentials is how the browser learns to ask for them.
  it("charges nothing for a request that sent no password", async () => {
    const request = await serve(teamsWith([team]));

    for (let i = 0; i < ADMIN_ATTEMPT_LIMIT + 5; i++) {
      expect((await request("/team/admin/all")).status).toBe(401);
    }
    expect((await request("/team/admin/all", CREDENTIALS)).status).toBe(200);
  });

  // The charge is given back once the password checks out, so what the route
  // itself answers is not a failed guess.
  it("charges nothing for an organiser's request the route refuses", async () => {
    const request = await serve(teamsWith([]));

    for (let i = 0; i < ADMIN_ATTEMPT_LIMIT + 5; i++) {
      expect((await request("/game/admin/no-such-match/state", CREDENTIALS)).status).toBe(404);
    }
  });
});

// The check above is per route, so a route added later can only be safe by
// naming the middleware. These are what notice when one does not.
describe("every admin route", () => {
  const ADMIN_PATH = /^\/(team|game)\/admin(\/|$)/i;

  function routes() {
    const adminAuth = requireAdmin(PASSWORD);
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teamsWith([]), [], adminAuth);
    // @koa/router types a layer's middleware against the default context, not
    // the router's own, so the identity checks need the wider element type.
    const middleware = (layer: (typeof router.stack)[number]) => layer.stack as unknown[];
    const guards = (layer: (typeof router.stack)[number]) => middleware(layer).includes(adminAuth);
    const guardsFirst = (layer: (typeof router.stack)[number]) => middleware(layer)[0] === adminAuth;
    return { stack: router.stack, guards, guardsFirst };
  }

  // First in the route's stack rather than merely somewhere in it: several of
  // these routes run a body parser, and one that parsed before the password was
  // checked would write an unauthenticated upload to disk.
  it("asks for the organisers' password before it does anything", () => {
    const { stack, guardsFirst } = routes();

    const admin = stack.filter(layer => ADMIN_PATH.test(layer.path));

    expect(admin.length).toBeGreaterThan(0);
    expect(admin.filter(layer => !guardsFirst(layer)).map(layer => layer.path)).toStrictEqual([]);
  });

  // The other way round: the login belongs to the admin routes only, so a
  // team route that picked it up would lock the competition out.
  it("is the only kind of route that does", () => {
    const { stack, guards } = routes();

    expect(stack.filter(layer => guards(layer) && !ADMIN_PATH.test(layer.path))).toStrictEqual([]);
  });
});
