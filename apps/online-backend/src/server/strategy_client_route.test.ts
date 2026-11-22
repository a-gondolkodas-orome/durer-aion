import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { strategyGameName } from "schemas";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";
import { registry } from "problem-bank/all";

// A reference competition whose strategy game is minta-ketkupac.
const COMPETITION = "klmgbpb334--minta-teljes";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the 4xx under test.
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, [], requireAdmin("unused-here"), registry);
  app.use(router.routes());
  const handle = app.callback();
  server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  port = (server.address() as AddressInfo).port;
}, 30_000);

afterAll(async () => {
  await new Promise(resolve => server?.close(resolve));
  await database?.stop();
});

beforeEach(async () => {
  await database.reset();
});

const HOUR_MS = 60 * 60 * 1000;

/** A strategy match of `gameName` whose clock ends `endsInMs` from now: past means finished. */
async function match(id: string, gameName: string, endsInMs = HOUR_MS) {
  const G = {
    start: new Date(Date.now() - HOUR_MS).toISOString(),
    end: new Date(Date.now() + endsInMs).toISOString(),
    points: 0,
    liveResults: [],
  };
  await database.db.createMatch(id, {
    initialState: { G, ctx: { phase: "startNewGame" } } as never,
    metadata: { gameName, players: {} } as never,
  });
  return id;
}

const teamIds = ["3c1f8a52-6a0e-4c4b-9a43-2f1e5d7b9c10", "5d2e9b63-7b1f-4d5c-8b54-3a2f6e8c0d21"];

async function team(index: number, strategyMatchID?: string) {
  const teamId = teamIds[index];
  const row = await database.teams.insertTeam({
    teamname: `Team ${index}`,
    competitionId: COMPETITION,
    email: "team@example.com",
    other: "",
    teamId,
    joinCode: `11${index}-2222-333`,
    credentials: `67676767-6767-4767-a767-67676767676${index}`,
  });
  await row.update({ pageState: "STRATEGY", strategyMatchID: strategyMatchID ?? null });
  return teamId;
}

const client = (teamId?: string) => fetch(`http://127.0.0.1:${port}/team/me/strategy-client.js?match=x`, {
  headers: teamId === undefined ? {} : { cookie: `${TEAM_COOKIE}=${teamId}` },
});

describe("GET /team/me/strategy-client.js", () => {
  it("refuses a request without a session", async () => {
    expect((await client()).status).toBe(401);
  });

  it("refuses a team that has not started its strategy match", async () => {
    const response = await client(await team(0));

    expect(response.status).toBe(404);
    expect(response.headers.get("x-accel-redirect")).toBeNull();
  });

  // nginx keeps these headers for the file; koa's text/plain broke the board.
  it("serves a running match's game as uncached JavaScript", async () => {
    const response = await client(await team(0, await match("running", strategyGameName("minta-ketkupac"))));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/ketkupac.js");
    expect(response.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
  });

  it("serves a finished match's game", async () => {
    const response = await client(await team(0, await match("done", strategyGameName("minta-ketkupac"), -HOUR_MS / 2)));

    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/ketkupac.js");
  });

  // Both teams are in a competition that plays minta-ketkupac: the match decides.
  it("serves each team its own match's game", async () => {
    const first = await team(0, await match("first", strategyGameName("minta-sablon")));
    const second = await team(1, await match("second", strategyGameName("20o-d")));

    expect((await client(first)).headers.get("x-accel-redirect")).toBe("/gated/strategy/sablon.js");
    expect((await client(second)).headers.get("x-accel-redirect")).toBe("/gated/strategy/20ocde.js");
  });
});
