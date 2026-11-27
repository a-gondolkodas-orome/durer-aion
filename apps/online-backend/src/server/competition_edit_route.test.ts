import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { Bundle } from "problem-bank";
import { registry } from "problem-bank/all";
import type { CompetitionConfig } from "schemas";
import { hostedGames } from "../games";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import type { CompetitionWriteReport } from "./competition_edit";
import type { ContentSources } from "./database_sources";
import { importBundle, openContentSources } from "./database_sources";
import { CompetitionModel } from "./model";
import { configureTeamsRouter } from "./router";
import { startTestDatabase } from "./test_database";

// PUT /team/admin/competitions/:id over HTTP against PGlite (#817): a database
// competition's settings are replaced whole, validated, and locked where a
// started team needs them to stay.

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as Bundle;
const FULL = "aqvco71pta--csomag-teljes";
const IN_CODE = "klmgbpb334--minta-teljes";
const PASSWORD = "pw";
const stored: CompetitionConfig = { ...sample.competitions[FULL], id: FULL };
const { relay, strategy } = stored;
if (relay === undefined || strategy === undefined) throw new Error(`The sample's ${FULL} has both matches`);

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

async function put(competition: unknown, { id = FULL, dryRun = false } = {}) {
  return await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${id}${dryRun ? "?dryRun=1" : ""}`, {
    method: "PUT", headers: admin, body: JSON.stringify({ competition }),
  });
}

async function report(competition: unknown, options?: { dryRun?: boolean }): Promise<CompetitionWriteReport> {
  const response = await put(competition, options);
  expect(response.status).toBe(200);
  return await response.json() as CompetitionWriteReport;
}

async function storedBody() {
  return (await CompetitionModel.findByPk(FULL))?.body;
}

async function startRelay() {
  const team = await database.teams.insertTeam({
    teamname: "Alpha", competitionId: FULL, email: "", other: "",
    teamId: "8eae8669-125c-42e5-8b49-89afbac31679", joinCode: "111-2222-333",
    credentials: "67676767-6767-4767-a767-676767676767",
  });
  await team.update({ pageState: "RELAY", relayMatchID: "some-match" });
}

const changed: CompetitionConfig = {
  ...stored,
  relay: { ...relay, durationMinutes: 45 },
  strategy: { ...strategy, durationMinutes: 25 },
  startWindow: { opensAt: "2099-01-01T14:00+01:00", closesAt: "2099-01-01T18:00+01:00" },
  advancingPoints: 12,
  finishMessage: { hu: "Köszönjük!" },
  metadata: { kind: "competition", edition: 21, round: "online", category: "C" },
};

it("writes a changed competition, which the server then serves", async () => {
  expect(await report(changed)).toEqual({ written: true, errors: [], warnings: [], started: false });
  // `toEqual` takes the undefined id for a missing one: the body is stored without it.
  expect(await storedBody()).toEqual({ ...changed, id: undefined });
  const served = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${FULL}`, { headers: admin });
  expect((await served.json() as { competition: CompetitionConfig }).competition).toEqual(changed);
});

it("writes nothing on a dry run, and answers what the write would do", async () => {
  expect(await report(changed, { dryRun: true })).toEqual({ written: false, errors: [], warnings: [], started: false });
  expect(await storedBody()).toEqual(sample.competitions[FULL]);
});

it("refuses an invalid competition with the validator's Hungarian messages, on a dry run and on write", async () => {
  const invalid = { ...stored, advancingPoints: 0, strategy: { durationMinutes: 20, gameId: "nincs-ilyen" } };
  for (const dryRun of [true, false]) {
    const answer = await report(invalid, { dryRun });
    expect(answer.written).toBe(false);
    expect(answer.errors).toEqual([
      `verseny ${FULL}: a továbbjutási ponthatár (0) nem pozitív egész szám`,
      `verseny ${FULL}: nincs ilyen stratégiás játék: nincs-ilyen`,
    ]);
  }
  expect(await storedBody()).toEqual(sample.competitions[FULL]);
});

it("refuses a body that is no competition, or that changes the id", async () => {
  expect((await report({ ...stored, languages: "hu" })).errors).toEqual([expect.stringContaining(`verseny ${FULL}:`)]);
  expect((await report({ ...stored, id: "zzzzzzzzzz--masik" })).errors)
    .toEqual([`verseny ${FULL}: az azonosító nem változhat (a kérésben: zzzzzzzzzz--masik)`]);
});

it("keeps a started competition's languages, matches and relay problems, and lets the rest change", async () => {
  await startRelay();
  const locked = await report({
    ...stored,
    languages: ["en"],
    strategy: undefined,
    relay: { ...relay, problems: [...relay.problems].reverse() },
  });
  expect(locked.written).toBe(false);
  expect(locked.started).toBe(true);
  expect(locked.errors).toEqual(expect.arrayContaining([
    "A magyar nyelv nem vehető el: már indult csapat ebben a versenyben.",
    "A stratégiás játék nem vehető el: már indult csapat ebben a versenyben.",
    "A váltó feladatai, sorrendjük és pontjuk nem változhat: már indult csapat ebben a versenyben.",
  ]));

  const allowed = await report({ ...changed, strategy: { durationMinutes: 25, gameId: "minta-ketkupac" } });
  expect(allowed).toMatchObject({ written: true, errors: [], started: true });
  expect(allowed.warnings).toEqual([expect.stringContaining("a futó meccsek a régi beállításokkal")]);
});

it("warns that a window set on the Versenyek tab outranks the one given here", async () => {
  await database.teams.setCompetitionWindow(FULL, { opensAt: "2099-02-01T14:00+01:00" });
  expect((await report(changed, { dryRun: true })).warnings)
    .toEqual([expect.stringContaining("külön indítási ablakot adtak meg")]);
});

it("refuses a competition held in code, and one no one holds", async () => {
  const inCode = await put({ ...stored, id: IN_CODE }, { id: IN_CODE });
  expect(inCode.status).toBe(403);
  expect(await inCode.json()).toMatchObject({ code: "COMPETITION_IN_CODE" });
  const missing = await put({ ...stored, id: "zzzzzzzzzz--nincs" }, { id: "zzzzzzzzzz--nincs" });
  expect(missing.status).toBe(404);
});

it("asks for the organisers' login", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${FULL}`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ competition: stored }),
  });
  expect(response.status).toBe(401);
});
