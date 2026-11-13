import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { PageState } from "schemas";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// The way back to a finished strategy match only ever shows it: it must not
// take a team to a match still running, or away from a relay it is playing.
// The rows below sit at HOME where they could, so that the rule refuses them
// and not only the write's own condition on the page.

const TEAM_ID = "3c1f8a52-6a0e-4c4b-9a43-2f1e5d7b9c10";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the 403s under test.
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, [], requireAdmin("unused-here"));
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

const HOUR_MS = 60 * 60 * 1000;

/** A match whose clock ends `endsInMs` from now: past means finished. */
async function match(id: string, endsInMs: number) {
  const G = {
    start: new Date(Date.now() - HOUR_MS).toISOString(),
    end: new Date(Date.now() + endsInMs).toISOString(),
    points: 9,
    liveResults: ["lost", "won", "won"],
  };
  await database.db.createMatch(id, {
    initialState: { G, ctx: { phase: "startNewGame" } } as never,
    metadata: { gameName: "test", players: {} } as never,
  });
  return id;
}

beforeEach(async () => {
  await database.reset();
});

async function team(fields: { pageState: PageState, relayMatchID?: string, strategyMatchID?: string }) {
  const row = await database.teams.insertTeam({
    teamname: "Alpha",
    competitionId: "unused-here",
    category: "C",
    email: "team@example.com",
    other: "",
    teamId: TEAM_ID,
    joinCode: "111-2222-333",
    credentials: "67676767-6767-4767-a767-676767676767",
  });
  await row.update(fields);
}

const view = () => fetch(`http://127.0.0.1:${port}/team/me/strategy/view`, {
  method: "POST",
  headers: { cookie: `${TEAM_COOKIE}=${TEAM_ID}` },
});
const pageState = async () => (await database.teams.getTeam({ teamId: TEAM_ID }))?.pageState;

it("takes a team at home back to its finished strategy match, which stays finished", async () => {
  await team({ pageState: "HOME", strategyMatchID: await match("done", -HOUR_MS / 2) });

  const response = await view();

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    pageState: "STRATEGY",
    strategyMatch: { state: "FINISHED", score: 9, strategyResults: ["lost", "won", "won"] },
  });
  expect(await pageState()).toBe("STRATEGY");
});

it("refuses a strategy match that has not started", async () => {
  await team({ pageState: "HOME" });

  expect((await view()).status).toBe(403);
  expect(await pageState()).toBe("HOME");
});

it("refuses a strategy match still running", async () => {
  await team({ pageState: "HOME", strategyMatchID: await match("running", HOUR_MS) });

  expect((await view()).status).toBe(403);
  expect(await pageState()).toBe("HOME");
});

it("refuses while the relay runs, even with the strategy match finished", async () => {
  await team({
    pageState: "HOME",
    relayMatchID: await match("relay", HOUR_MS),
    strategyMatchID: await match("done", -HOUR_MS / 2),
  });

  expect((await view()).status).toBe(403);
  expect(await pageState()).toBe("HOME");
});

it("refuses a team that has not accepted the disclaimer", async () => {
  await team({ pageState: "DISCLAIMER", strategyMatchID: await match("done", -HOUR_MS / 2) });

  expect((await view()).status).toBe(403);
  expect(await pageState()).toBe("DISCLAIMER");
});
