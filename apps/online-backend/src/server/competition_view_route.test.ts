import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { Bundle } from "problem-bank";
import { registry } from "problem-bank/all";
import { hostedGames } from "../games";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import type { AdminCompetitionView } from "./competition_view";
import { problemUses } from "./competition_view";
import { importBundle, openContentSources } from "./database_sources";
import { configureTeamsRouter } from "./router";
import { startTestDatabase } from "./test_database";

// GET /team/admin/competitions/:id, the competition's admin page (#816), over
// HTTP against PGlite: in-code and database competitions alike, answers and
// every use of each problem included.

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as Bundle;
const RELAY = "903xajr9et--csomag-valto";
const FULL = "aqvco71pta--csomag-teljes";
const SHARED = "10iqp4vy6b--csomag-kockak";
const IN_CODE_PROBLEM = "k5g58wuf6h--minta-korongok";
const IN_CODE = "klmgbpb334--minta-teljes";
const PASSWORD = "pw";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  const sources = await openContentSources(database.teams, registry);
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the refusals under test.
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, hostedGames().map(({ game }) => game), requireAdmin(PASSWORD), sources);
  app.use(router.routes());
  const handle = app.callback();
  server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  port = (server.address() as AddressInfo).port;
  expect((await importBundle(database.teams, sample, sources)).written).toBe(true);
}, 30_000);

afterAll(async () => {
  await new Promise(resolve => server?.close(resolve));
  await database?.stop();
  vi.unstubAllEnvs();
});

const admin = { authorization: `Basic ${btoa(`${ADMIN_USER}:${PASSWORD}`)}` };

async function get(id: string, headers: Record<string, string> = admin) {
  return await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${id}`, { headers });
}

async function view(id: string): Promise<AdminCompetitionView> {
  const response = await get(id);
  expect(response.status).toBe(200);
  return await response.json() as AdminCompetitionView;
}

it("serves a database competition with its relay's problems in play order, answers included", async () => {
  const served = await view(FULL);
  expect(served.storedIn).toBe("database");
  expect(served.competition).toEqual({ ...sample.competitions[FULL], id: FULL });
  expect(served.relayProblems.map(({ problem, points, storedIn }) => [problem.id, problem.answer, points, storedIn]))
    .toEqual([["roow9oo75t--csomag-paros", 50, 3, "database"], [SHARED, 27, 4, "database"]]);
});

it("lists every use of a shared problem, in each relay that has it, this one included", async () => {
  const shared = (await view(RELAY)).relayProblems.find(({ problem }) => problem.id === SHARED);
  expect(shared?.uses.map(({ competitionId, position, points }) => [competitionId, position, points]))
    .toEqual(expect.arrayContaining([[RELAY, 1, 3], [FULL, 2, 4]]));
  expect(shared?.uses).toHaveLength(2);
});

it("marks an in-code problem a database relay reuses as held in code", async () => {
  const reused = (await view(RELAY)).relayProblems.find(({ problem }) => problem.id === IN_CODE_PROBLEM);
  expect(reused?.storedIn).toBe("code");
  expect(reused?.uses.map(({ competitionId }) => competitionId)).toContain(RELAY);
});

it("serves an in-code competition the same way", async () => {
  const served = await view(IN_CODE);
  expect(served.storedIn).toBe("code");
  expect(served.relayProblems.length).toBe(registry.competitions.get(IN_CODE)?.relay?.problems.length);
  expect(served.relayProblems.every(({ uses }) => uses.some(({ competitionId }) => competitionId === IN_CODE))).toBe(true);
});

it.each([
  ["an unknown id", "nnnnnnnnnn--nincs", admin, 404],
  ["without the password", FULL, {}, 401],
])("refuses %s", async (_, id, headers, status) => {
  expect((await get(id, headers)).status).toBe(status);
});

it("still serves the export, which the route would otherwise take for an id", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/export`, { headers: admin });
  expect(await response.json()).toMatchObject({ format: "durer-competitions" });
});

describe("problemUses", () => {
  it("counts a relay that uses a problem twice as two uses", () => {
    const metadata = { kind: "other", label: { hu: "x" } } as const;
    const uses = problemUses([{
      id: RELAY, languages: ["hu"], metadata,
      relay: { durationMinutes: 30, problems: [{ problemId: SHARED, points: 3 }, { problemId: SHARED, points: 5 }] },
    }]);
    expect(uses.get(SHARED)).toEqual([
      { competitionId: RELAY, metadata, position: 1, points: 3 },
      { competitionId: RELAY, metadata, position: 2, points: 5 },
    ]);
  });
});
