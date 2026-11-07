import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { Sequelize } from "sequelize";
import type { TeamsRepository } from "./db";
import { TeamModel, teamAttributes } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";

// #706: a team row naming a match storage does not have. Nothing in the app
// leaves one behind; a hand edit or a partial restore of the database does.

const BROKEN_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const HEALTHY_ID = "0b6c8d2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e";
const RUNNING = "liveMatchId";
const GONE = "goneMatchId";
const PASSWORD = "organiser-password";
const ADMIN = { authorization: `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}` };
const AS_BROKEN_TEAM = { cookie: `${TEAM_COOKIE}=${BROKEN_ID}` };

// A real model over a Sequelize that is never connected, as team_reset.test.ts
// uses: `save` is the one call that would reach a database.
const sequelize = new Sequelize("db", "user", "password", { dialect: "postgres", logging: false });
TeamModel.init(teamAttributes, { sequelize, tableName: "Teams" });

function teamRow(teamId: string, teamName: string, relayMatchID: string | null, strategyMatchID: string | null) {
  const row = TeamModel.build({
    teamId,
    joinCode: "000-0000-000",
    teamName,
    category: "C",
    credentials: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b",
    email: "team@example.com",
    pageState: "HOME",
    relayMatchID,
    strategyMatchID,
    other: "",
  });
  vi.spyOn(row, "save").mockResolvedValue(row);
  return row;
}

describe("a team row naming a match storage does not have", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve() {
    // The broken team's strategy match is real and running; its relay column
    // names a match storage has lost.
    const broken = teamRow(BROKEN_ID, "Broken", GONE, RUNNING);
    const healthy = teamRow(HEALTHY_ID, "Healthy", RUNNING, null);
    const rows = [broken, healthy];
    const teams = {
      getTeam: vi.fn(({ teamId }: { teamId: string }) => Promise.resolve(rows.find(it => it.teamId === teamId) ?? null)),
      listTeams: vi.fn().mockResolvedValue(rows),
    } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The refusals under test are errors koa would otherwise log.
    app.silent = true;
    const running = { G: { start: new Date().toISOString(), end: "2099-01-01T00:00:00Z", points: 0 }, ctx: {} };
    app.context.db = {
      fetch: (id: string) => ({ state: id === RUNNING ? running : undefined }),
    } as unknown as Server.AppCtx["db"];
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    const request = (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init);
    return { request, broken };
  }

  it("is marked on the admin list, and every other row reads as before", async () => {
    const { request } = await serve();

    const response = await request("/team/admin/all", { headers: ADMIN });

    expect(response.status).toBe(200);
    const [broken, healthy] = await response.json() as { relayMatch: unknown, strategyMatch: unknown }[];
    expect(broken.relayMatch).toStrictEqual({ state: "BROKEN", matchID: GONE });
    expect(broken.strategyMatch).toMatchObject({ state: "IN PROGRESS", matchID: RUNNING });
    expect(healthy.relayMatch).toMatchObject({ state: "IN PROGRESS", matchID: RUNNING });
  });

  it.each([
    ["GET", "/team/me"],
    ["POST", "/team/me/gohome"],
    ["POST", "/team/me/relay/play"],
    ["POST", "/team/me/strategy/play"],
  ])("refuses the team's own %s %s with a 409 the team can read", async (method, path) => {
    const { request } = await serve();

    const response = await request(path, { method, headers: AS_BROKEN_TEAM });

    expect(response.status).toBe(409);
    expect(await response.text()).toMatch(/szervezőt/);
  });

  it("is repaired by the admin reset of the broken column", async () => {
    const { request, broken } = await serve();

    const response = await request(`/team/admin/${BROKEN_ID}/reset/relay`, { method: "POST", headers: ADMIN });

    expect(response.status).toBe(200);
    expect(broken.relayMatchID).toBeNull();
    expect(broken.other).toBe(`prevrelayid:${GONE}`);
    expect((await response.json() as { relayMatch: unknown }).relayMatch).toStrictEqual({ state: "NOT STARTED" });
    expect((await request("/team/me", { headers: AS_BROKEN_TEAM })).status).toBe(200);
  });
});
