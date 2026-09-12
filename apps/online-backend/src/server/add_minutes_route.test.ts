import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server, StorageAPI } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

// The route over HTTP, the way admin_session.test.ts serves it. The walk itself
// is add_minutes.test.ts'; what this is about is the body the route accepts.
describe("POST /game/admin/addminutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
    vi.restoreAllMocks();
  });

  async function serve(rows: TeamModel[] = []) {
    const teams = { listTeams: vi.fn().mockResolvedValue(rows) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 400s are what this file is about, and koa logs every error it writes.
    app.silent = true;
    app.context.db = { fetch: vi.fn(), setState: vi.fn() } as unknown as StorageAPI.Async;
    app.context.durer_transport = { getMatchQueue: () => ({ add: (task: () => unknown) => task() }), pubSub: {} };
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (body: unknown, auth = CREDENTIALS) => fetch(`http://127.0.0.1:${port}/game/admin/addminutes`, {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("asks for the organisers' password", async () => {
    const request = await serve();

    expect((await request({ minutes: 10, grant: "a1b2c3d4" }, "")).status).toBe(401);
  });

  it("answers the walk's result for a well formed grant", async () => {
    const request = await serve();

    const response = await request({ minutes: 10, grant: "a1b2c3d4" });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ extended: [], alreadyGranted: [], problems: [] });
  });

  // A non-number used to reach `setMinutes`, where it becomes an Invalid Date
  // and throws on the way out of `toISOString` — a 500 for a typo.
  it.each([
    ["no minutes", { grant: "a1b2c3d4" }],
    ["minutes that are not a number", { minutes: "soon", grant: "a1b2c3d4" }],
    ["a fractional number of minutes", { minutes: 1.5, grant: "a1b2c3d4" }],
    ["no grant", { minutes: 10 }],
    ["an empty grant", { minutes: 10, grant: "" }],
    ["a grant that is not a string", { minutes: 10, grant: 7 }],
  ])("refuses %s", async (_case, body) => {
    const request = await serve();

    expect((await request(body)).status).toBe(400);
  });
});
