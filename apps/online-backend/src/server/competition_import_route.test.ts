import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { registry } from "problem-bank/all";
import { hostedGames } from "../games";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import type { BundleImportReport, ContentSources } from "./database_sources";
import { openContentSources } from "./database_sources";
import { CompetitionModel, ProblemModel } from "./model";
import { configureTeamsRouter } from "./router";
import { import_teams_from_tsv } from "./team_import";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// POST /team/admin/competitions/import, over HTTP against PGlite: a bundle is
// written whole or not at all (#813).

interface SampleBundle {
  format: string;
  version: number;
  competitions: Record<string, { relay?: object, strategy?: object }>;
  problems: Record<string, { answer: number }>;
}

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as SampleBundle;
const FULL = "aqvco71pta--csomag-teljes";
const PASSWORD = "pw";

const hosted = hostedGames();
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
  configureTeamsRouter(router, database.teams, hosted.map(({ game }) => game), requireAdmin(PASSWORD), sources);
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
});

const admin = { authorization: `Basic ${btoa(`${ADMIN_USER}:${PASSWORD}`)}` };

async function post(body: unknown, headers: Record<string, string> = { ...admin, "content-type": "application/json" }) {
  return await fetch(`http://127.0.0.1:${port}/team/admin/competitions/import`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
}

async function importBundle(body: unknown): Promise<BundleImportReport> {
  const response = await post(body);
  expect(response.status).toBe(200);
  return await response.json() as BundleImportReport;
}

async function storedIds() {
  return [
    ...(await CompetitionModel.findAll()).map(({ id }) => id),
    ...(await ProblemModel.findAll()).map(({ id }) => id),
  ].sort();
}

const sampleIds = [...Object.keys(sample.competitions), ...Object.keys(sample.problems)].sort();

it("writes the sample bundle, which the list then shows as held in the database, and whose matches play", async () => {
  const report = await importBundle(sample);
  expect(report).toEqual({
    written: true,
    competitions: Object.keys(sample.competitions),
    problems: Object.keys(sample.problems),
    errors: [],
  });
  expect(await storedIds()).toEqual(sampleIds);

  const listed = await fetch(`http://127.0.0.1:${port}/team/admin/competitions`, { headers: admin });
  const competitions = await listed.json() as { id: string, storedIn: string }[];
  expect(competitions.find(({ id }) => id === FULL)?.storedIn).toBe("database");
  expect(competitions.find(({ id }) => id === "klmgbpb334--minta-teljes")?.storedIn).toBe("code");

  // A team each, since a team in the middle of one match may not start the other.
  const file = join(mkdtempSync(join(tmpdir(), "teams-")), "teams.tsv");
  writeFileSync(file, `Teamname\tCompetition\nAlpha\t${FULL}\nBravo\t${FULL}\n`);
  expect((await import_teams_from_tsv(database.teams, file, sources.competitionSource)).successful).toBe(2);
  for (const [name, match] of [["Alpha", "relay"], ["Bravo", "strategy"]]) {
    const team = (await database.teams.listTeams())?.find(({ teamName }) => teamName === name);
    if (team === undefined) throw new Error(`${name} was not imported`);
    await team.update({ pageState: "HOME" });
    const response = await fetch(`http://127.0.0.1:${port}/team/me/${match}/play`,
      { method: "POST", headers: { cookie: `${TEAM_COOKIE}=${team.teamId}` } });
    expect(response.status, match).toBe(200);
  }
});

it("writes nothing of a bundle with one invalid competition, and lists the validator's messages", async () => {
  const report = await importBundle({
    ...sample,
    competitions: { ...sample.competitions, [FULL]: { ...sample.competitions[FULL], strategy: { durationMinutes: 20, gameId: "nincs-ilyen" } } },
  });
  expect(report).toEqual({
    written: false, competitions: [], problems: [],
    errors: [`verseny ${FULL}: nincs ilyen stratégiás játék: nincs-ilyen`],
  });
  expect(await storedIds()).toEqual([]);
});

it("writes nothing of a bundle of the wrong shape, and names each field", async () => {
  const [id, problem] = Object.entries(sample.problems)[0];
  const report = await importBundle({ ...sample, problems: { ...sample.problems, [id]: { ...problem, answer: "27" } } });
  expect(report.errors).toEqual([`feladat ${id}: az answer nem szám`]);
  expect(await storedIds()).toEqual([]);
});

it("writes nothing of a bundle with an id the code holds, and names it", async () => {
  const inCode = "k5g58wuf6h--minta-korongok";
  const report = await importBundle({
    ...sample, problems: { ...sample.problems, [inCode]: { answer: 1, content: { hu: { problemText: "?" } } } },
  });
  expect(report.errors).toEqual([`${inCode}: ez az azonosító már szerepel a kódban`]);
  expect(await storedIds()).toEqual([]);
});

it("writes nothing of a bundle with an id the database holds, and names it", async () => {
  const [id, problem] = Object.entries(sample.problems)[0];
  await ProblemModel.create({ id, body: problem as never, createdBy: null });
  const report = await importBundle(sample);
  expect(report.errors).toEqual([`${id}: ez az azonosító már szerepel az adatbázisban`]);
  expect(await storedIds()).toEqual([id]);
});

it("reports a stored problem the bundle builds on that breaks the rules, rather than failing", async () => {
  const stored = "ssssssssss--tarolt-hibas";
  await ProblemModel.create({ id: stored, body: { answer: 1.5, content: { hu: { problemText: "?" } } }, createdBy: null });
  const relay = { durationMinutes: 30, problems: [{ problemId: stored, points: 3 }] };
  const report = await importBundle({ ...sample, competitions: { [FULL]: { ...sample.competitions[FULL], relay } } });
  expect(report.errors).toEqual([
    `${stored}: a csomag ezt a már tárolt feladatot használja, de a tárolt feladat hibás`,
    `feladat ${stored}: a válasz (1.5) nem egész szám`,
  ]);
  expect(await storedIds()).toEqual([stored]);
});

it("names every id of a bundle imported twice, and leaves the first import as it was", async () => {
  expect((await importBundle(sample)).written).toBe(true);
  const report = await importBundle(sample);
  expect(report.errors).toEqual(sampleIds.map(id => `${id}: ez az azonosító már szerepel az adatbázisban`));
  expect(await storedIds()).toEqual(sampleIds);
});

it.each([
  ["without the password", { "content-type": "application/json" }, 401],
  ["of anything but JSON", { ...admin, "content-type": "text/plain" }, 415],
])("refuses a bundle %s", async (_, headers, status) => {
  expect((await post(sample, headers)).status).toBe(status);
  expect(await storedIds()).toEqual([]);
});
