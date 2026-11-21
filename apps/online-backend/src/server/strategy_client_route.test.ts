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

// The strategy game's client reaches a team only once the team has started
// it, and it is the game of the team's own match (issue #643). nginx serves
// the file the answer names; here the answer is all there is.

// A reference competition whose strategy game is minta-ketkupac.
const COMPETITION = "klmgbpb334--minta-teljes";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the 4xx and the 500 under test.
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
const teamView = async (teamId: string) => (await (await fetch(`http://127.0.0.1:${port}/team/me`, {
  headers: { cookie: `${TEAM_COOKIE}=${teamId}` },
})).json()) as { strategyGame: unknown };

describe("GET /team/me/strategy-client.js", () => {
  it("refuses a request without a session", async () => {
    expect((await client()).status).toBe(401);
  });

  it("refuses a team that has not started its strategy match", async () => {
    const response = await client(await team(0));

    expect(response.status).toBe(404);
    expect(response.headers.get("x-accel-redirect")).toBeNull();
  });

  it("serves a running match's game, uncached, with nothing in the body", async () => {
    const response = await client(await team(0, await match("running", strategyGameName("minta-ketkupac"))));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/ketkupac.js");
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    expect(await response.text()).toBe("");
  });

  it("serves a finished match's game", async () => {
    const response = await client(await team(0, await match("done", strategyGameName("minta-ketkupac"), -HOUR_MS / 2)));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/ketkupac.js");
  });

  it("serves the folder of a game played in a variant", async () => {
    const response = await client(await team(0, await match("variant", strategyGameName("20o-d"))));

    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/20ocde.js");
  });

  it("serves each team its own match's game", async () => {
    const first = await team(0, await match("first", strategyGameName("minta-ketkupac")));
    const second = await team(1, await match("second", strategyGameName("minta-sablon")));

    expect((await client(first)).headers.get("x-accel-redirect")).toBe("/gated/strategy/ketkupac.js");
    expect((await client(second)).headers.get("x-accel-redirect")).toBe("/gated/strategy/sablon.js");
  });

  // The competition plays minta-ketkupac; an organiser changed it after this
  // match started with minta-sablon.
  it("serves the game the match was started with, not the competition's", async () => {
    const response = await client(await team(0, await match("before-change", strategyGameName("minta-sablon"))));

    expect(response.headers.get("x-accel-redirect")).toBe("/gated/strategy/sablon.js");
  });

  it("fails, serving nothing, for a match of a game no folder plays", async () => {
    const response = await client(await team(0, await match("unknown", strategyGameName("nincs-ilyen"))));

    expect(response.status).toBe(500);
    expect(response.headers.get("x-accel-redirect")).toBeNull();
  });
});

describe("GET /team/me's strategyGame", () => {
  it("is null before the team starts", async () => {
    expect((await teamView(await team(0))).strategyGame).toBeNull();
  });

  it("names the started match's game and variant", async () => {
    const teamId = await team(0, await match("variant", strategyGameName("20o-d")));

    expect((await teamView(teamId)).strategyGame).toStrictEqual({ gameId: "20o-d", variant: "D" });
  });

  it("is null for a game no folder plays, and the rest of the view is still served", async () => {
    const teamId = await team(0, await match("unknown", strategyGameName("nincs-ilyen")));

    expect(await teamView(teamId)).toMatchObject({ strategyGame: null, strategyMatch: { state: "IN PROGRESS" } });
  });
});
