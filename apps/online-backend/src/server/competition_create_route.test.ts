import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { strategyGames } from "game/strategy";
import type { Bundle } from "problem-bank";
import { registry } from "problem-bank/all";
import type { CompetitionConfig, Problem } from "schemas";
import { hostedGames } from "../games";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import type { CompetitionWriteReport } from "./competition_edit";
import type { ContentSources } from "./database_sources";
import { importBundle, openContentSources } from "./database_sources";
import { CompetitionModel, ProblemModel } from "./model";
import { configureTeamsRouter } from "./router";
import { startTestDatabase } from "./test_database";

// POST /team/admin/competitions over HTTP against PGlite (#821): a competition
// made on the admin page, with the new problems its relay brings, validated
// and written to the database, its id and theirs taken by nothing yet.

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as Bundle;
const IN_DATABASE = "aqvco71pta--csomag-teljes";
const PROBLEM_IN_DATABASE = "roow9oo75t--csomag-paros";
const PASSWORD = "pw";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let sources: ContentSources;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  sources = await openContentSources(database.teams, registry);
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
}, 30_000);

afterAll(async () => {
  await new Promise(resolve => server?.close(resolve));
  await database?.stop();
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  await database.reset();
  expect((await importBundle(database.teams, sample, sources)).written).toBe(true);
});

const admin = { authorization: `Basic ${btoa(`${ADMIN_USER}:${PASSWORD}`)}`, "content-type": "application/json" };

async function create(competition: unknown, { dryRun = false, problems }: { dryRun?: boolean, problems?: unknown } = {}):
  Promise<CompetitionWriteReport> {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions${dryRun ? "?dryRun=1" : ""}`, {
    method: "POST", headers: admin, body: JSON.stringify({ competition, problems }),
  });
  expect(response.status).toBe(200);
  return await response.json() as CompetitionWriteReport;
}

async function served(id: string): Promise<CompetitionConfig | undefined> {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${id}`, { headers: admin });
  return response.status === 200 ? (await response.json() as { competition: CompetitionConfig }).competition : undefined;
}

const NEW_ID = "n3wc0mpet1--uj-verseny";
const fresh: Problem = { id: "n3wpr0b1em--uj-feladat", answer: 7, content: { hu: { problemText: "Mennyi $3 + 4$?" } } };
const relayOnly: CompetitionConfig = {
  id: NEW_ID,
  languages: ["hu"],
  relay: { durationMinutes: 60, problems: [{ problemId: fresh.id, points: 3 }, { problemId: PROBLEM_IN_DATABASE, points: 4 }] },
  metadata: { kind: "competition", edition: 21, round: "online", category: "C" },
};
const gameId = Object.keys(strategyGames)[0];
const strategyOnly: CompetitionConfig = {
  id: NEW_ID,
  languages: ["hu"],
  strategy: { durationMinutes: 30, gameId },
  metadata: { kind: "other", label: { hu: "Próba" } },
};

it("creates a relay-only, a strategy-only and a full competition, which the server then serves", async () => {
  expect(await create(relayOnly, { problems: [fresh] })).toEqual({ written: true, errors: [], warnings: [], started: false });
  expect(await served(NEW_ID)).toEqual(relayOnly);
  expect((await ProblemModel.findByPk(fresh.id))?.body).toEqual({ ...fresh, id: undefined });

  const other = "n3wc0mpet2--strategia";
  expect((await create({ ...strategyOnly, id: other })).written).toBe(true);
  expect(await served(other)).toEqual({ ...strategyOnly, id: other });

  const full = { ...relayOnly, id: "n3wc0mpet3--teljes", strategy: strategyOnly.strategy };
  expect((await create(full)).written).toBe(true);
  // Served beside the in-code ones, to import teams into.
  const listed = await fetch(`http://127.0.0.1:${port}/team/admin/competitions`, { headers: admin });
  expect(await listed.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: full.id, storedIn: "database" }),
  ]));
  expect(await sources.competitionSource.getCompetition(full.id)).toEqual(full);
});

it("writes nothing on a dry run, and answers what the write would do", async () => {
  expect(await create(relayOnly, { dryRun: true, problems: [fresh] }))
    .toEqual({ written: false, errors: [], warnings: [], started: false });
  expect(await CompetitionModel.findByPk(NEW_ID)).toBeNull();
  expect(await ProblemModel.findByPk(fresh.id)).toBeNull();
});

it("refuses an invalid competition with the validator's Hungarian messages, and writes nothing of it", async () => {
  const answer = await create({ ...strategyOnly, id: "nem-jo", strategy: { durationMinutes: 30, gameId: "nincs-ilyen" } });
  expect(answer.written).toBe(false);
  expect(answer.errors).toEqual(expect.arrayContaining([
    expect.stringContaining("verseny nem-jo: az azonosító"),
    "verseny nem-jo: nincs ilyen stratégiás játék: nincs-ilyen",
  ]));
  expect((await create("nem verseny")).errors).toEqual(["A kérésben a verseny azonosítója nem szöveg."]);
});

it("refuses an id already held, in code or in the database, as a competition or a problem", async () => {
  const [inCode] = registry.competitions.keys();
  const [problemInCode] = registry.problems.keys();
  const taken = async (id: string) => (await create({ ...strategyOnly, id })).errors;
  expect(await taken(inCode)).toEqual([`verseny ${inCode}: ez az azonosító a kódban már egy versenyé`]);
  expect(await taken(problemInCode)).toEqual([`verseny ${problemInCode}: ez az azonosító a kódban már egy feladaté`]);
  expect(await taken(IN_DATABASE)).toEqual([`verseny ${IN_DATABASE}: ez az azonosító az adatbázisban már egy versenyé`]);
  expect(await taken(PROBLEM_IN_DATABASE))
    .toEqual([`verseny ${PROBLEM_IN_DATABASE}: ez az azonosító az adatbázisban már egy feladaté`]);
  expect(await CompetitionModel.findByPk(IN_DATABASE)).not.toBeNull();
});

it("refuses a new problem whose id is taken, the competition's own included", async () => {
  const clash = await create(
    { ...relayOnly, relay: { durationMinutes: 60, problems: [{ problemId: NEW_ID, points: 3 }] } },
    { problems: [{ ...fresh, id: NEW_ID }] });
  expect(clash.errors).toContain(`verseny ${NEW_ID}: egy új feladat is ezt az azonosítót kapná`);
  const stored = await create(relayOnly, { problems: [fresh, { ...fresh, id: PROBLEM_IN_DATABASE }] });
  expect(stored.errors).toContain(`feladat ${PROBLEM_IN_DATABASE}: ez az azonosító az adatbázisban már egy feladaté`);
  expect(await CompetitionModel.findByPk(NEW_ID)).toBeNull();
});

it("lists the strategy games a competition can name", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/strategy-games`, { headers: admin });
  expect(await response.json()).toEqual(Object.keys(strategyGames));
});

it("asks for the organisers' login", async () => {
  const created = await fetch(`http://127.0.0.1:${port}/team/admin/competitions`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ competition: relayOnly }),
  });
  expect(created.status).toBe(401);
  expect((await fetch(`http://127.0.0.1:${port}/team/admin/strategy-games`)).status).toBe(401);
});
