import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
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

// Two start requests from one team at once — a double click on Start, or two
// teammates' devices — against the real routes and a real postgres
// (test_database.ts). The routes check the team's state and write it several
// awaits apart, so only requests that overlap show whether the check holds:
// both used to answer 200 and leave two matches.

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // The refused request is one of the answers under test, and koa logs every
  // error it writes.
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
});

beforeEach(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  await database.reset();
  for (const matchID of await database.db.listMatches({})) {
    await database.db.wipe(matchID);
  }
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

afterEach(() => {
  vi.unstubAllEnvs();
});

const start = (game: "relay" | "strategy") => fetch(`http://127.0.0.1:${port}/team/me/${game}/play`, {
  method: "POST",
  headers: { cookie: `${TEAM_COOKIE}=${TEAM_ID}` },
});
const startRelay = () => start("relay");

describe("POST /team/me/:game/play", () => {
  it("refuses a second start once the first has answered", async () => {
    expect((await startRelay()).status).toBe(200);
    expect((await startRelay()).status).toBe(403);
    expect(await database.db.listMatches({})).toHaveLength(1);
  });

  it("starts one match when two requests overlap, and refuses the other", async () => {
    const statuses = (await Promise.all([startRelay(), startRelay()])).map(r => r.status).sort();

    const matches = await database.db.listMatches({});
    const team = await database.teams.getTeam({ teamId: TEAM_ID });
    expect({ statuses, matches: matches.length }).toStrictEqual({ statuses: [200, 403], matches: 1 });
    expect(team?.relayMatch).toMatchObject({ state: "IN PROGRESS", matchID: matches[0] });
  });

  it("starts one game when a team starts the relay and the strategy game at once", async () => {
    const statuses = (await Promise.all([start("relay"), start("strategy")])).map(r => r.status).sort();

    const matches = await database.db.listMatches({});
    const team = await database.teams.getTeam({ teamId: TEAM_ID });
    expect({ statuses, matches: matches.length }).toStrictEqual({ statuses: [200, 403], matches: 1 });
    expect([team?.relayMatch.state, team?.strategyMatch.state].sort()).toStrictEqual(["IN PROGRESS", "NOT STARTED"]);
  });
});
