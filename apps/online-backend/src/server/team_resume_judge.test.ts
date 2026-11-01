import { it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { MyGameWrappers, gameWrapper, strategyNames } from "game";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// What the route decides: that a team resumes only its own match. Taking the
// turn itself is the transport's, and socketio_transport.test.ts runs it over a
// real socket.

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const strategy = { ...gameWrapper(MyGameWrappers.C()), name: strategyNames.C };
const resumeBotTurn = vi.fn();

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the 404s under test.
  app.silent = true;
  app.context.db = database.db;
  app.context.durer_transport = { resumeBotTurn };
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, [strategy], requireAdmin("unused-here"));
  app.use(router.routes());
  const handle = app.callback();
  server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  port = (server.address() as AddressInfo).port;
}, 30_000);

afterAll(async () => {
  await new Promise(resolve => server?.close(resolve));
  await database?.stop();
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  resumeBotTurn.mockReset();
  await database.reset();
  const team = await database.teams.insertTeam({
    teamname: "Alpha",
    category: "C",
    email: "team@example.com",
    other: "",
    teamId: TEAM_ID,
    joinCode: "111-2222-333",
    credentials: "67676767-6767-4767-a767-676767676767",
  });
  await team.update({ pageState: "HOME" });
});

const post = (path: string, cookie = `${TEAM_COOKIE}=${TEAM_ID}`) =>
  fetch(`http://127.0.0.1:${port}${path}`, { method: "POST", headers: { cookie } });

async function startStrategy(): Promise<string> {
  const response = await post("/team/me/strategy/play");
  expect(response.status).toBe(200);
  return ((await response.json()) as { matchID: string }).matchID;
}

it("refuses a match that is not the team's", async () => {
  await startStrategy();

  expect((await post("/team/me/match/someone-elses/resume-judge")).status).toBe(404);
  expect(resumeBotTurn).not.toHaveBeenCalled();
});
