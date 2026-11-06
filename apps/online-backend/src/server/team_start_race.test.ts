import { it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { GameRelay, MyGameWrappers, gameWrapper, strategyNames } from "game";
import { relayNames } from "./common";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// The start routes check the team and write it several awaits apart, so only
// overlapping requests show whether the check holds. Regression: both used to
// answer 200, each leaving a match.

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the 403s under test.
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, [
    { ...GameRelay, name: relayNames.C },
    { ...gameWrapper(MyGameWrappers.C()), name: strategyNames.C },
  ], requireAdmin("unused-here"));
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

type Game = "relay" | "strategy";
const start = async (game: Game) => (await fetch(`http://127.0.0.1:${port}/team/me/${game}/play`, {
  method: "POST",
  headers: { cookie: `${TEAM_COOKIE}=${TEAM_ID}` },
})).status;

it("refuses a second start after the first answered", async () => {
  expect(await start("relay")).toBe(200);
  expect(await start("relay")).toBe(403);
});

it.each<[Game, Game]>([
  ["relay", "relay"],
  ["relay", "strategy"],
])("of overlapping %s and %s starts, keeps one match and refuses the other", async (first, second) => {
  const statuses = await Promise.all([start(first), start(second)]);

  const matches = await database.db.listMatches({});
  const team = await database.teams.getTeam({ teamId: TEAM_ID });
  const started = [team?.relayMatchID, team?.strategyMatchID].filter(id => id != null);
  expect(statuses.sort()).toStrictEqual([200, 403]);
  expect(matches).toHaveLength(1);
  expect(started).toStrictEqual([matches[0]]);
});
