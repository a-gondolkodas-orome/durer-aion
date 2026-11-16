import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { registry } from "problem-bank/all";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const MATCH_ID = "0EKBiMgbJ5A";
const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

// A match the route may not extend is a conflict with the match's state, not
// a route the server lacks: 409, with a code saying which conflict.
describe("POST /game/admin/:matchId/addminutes/:minutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(team: Partial<TeamModel>, end: string) {
    const teams = { getTeam: vi.fn().mockResolvedValue(team) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    const state = { G: { start: "2001-01-01T00:00:00Z", end, points: 0 }, ctx: {}, _stateID: 0 };
    const metadata = { players: { 0: { name: TEAM_ID } }, gameName: "unused" };
    app.context.db = { fetch: () => ({ state, metadata }) } as unknown as Server.AppCtx["db"];
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD), registry);
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return fetch(
      `http://127.0.0.1:${port}/game/admin/${MATCH_ID}/addminutes/5`,
      { method: "POST", headers: { authorization: CREDENTIALS } },
    );
  }

  it("refuses a match that is no longer the team's", async () => {
    const response = await serve({ relayMatchID: "another", strategyMatchID: null }, "2099-01-01T00:00:00Z");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "STALE_MATCH_ID" });
  });

  it("refuses a match that is over", async () => {
    const response = await serve({ relayMatchID: null, strategyMatchID: MATCH_ID }, "2001-01-01T01:00:00Z");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "MATCH_FINISHED" });
  });
});
