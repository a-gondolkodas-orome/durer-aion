import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { Bundle } from "problem-bank";
import { registry } from "problem-bank/all";
import type { Problem } from "schemas";
import { hostedGames } from "../games";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import type { ContentSources } from "./database_sources";
import { importBundle, openContentSources } from "./database_sources";
import { ProblemModel } from "./model";
import type { AdminProblemView, ProblemWriteReport } from "./problem_edit";
import type { ProblemSearchView } from "./problem_search";
import { configureTeamsRouter } from "./router";
import { startTestDatabase } from "./test_database";

// GET and PUT /team/admin/problems/:id (#818), and the picker's search,
// GET /team/admin/problems (#820), over HTTP against PGlite.

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as Bundle;
const FULL = "aqvco71pta--csomag-teljes";
const RELAY_ONLY = "903xajr9et--csomag-valto";
/** In both relays, in Hungarian and English. */
const SHARED = "10iqp4vy6b--csomag-kockak";
/** In the full competition's relay only. */
const OWN = "roow9oo75t--csomag-paros";
/** Held in code, in the relay-only competition's relay. */
const IN_CODE = "k5g58wuf6h--minta-korongok";
const PASSWORD = "pw";
const shared: Problem = { ...sample.problems[SHARED], id: SHARED };

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
const url = (id: string, dryRun = false) => `http://127.0.0.1:${port}/team/admin/problems/${id}${dryRun ? "?dryRun=1" : ""}`;

async function view(id: string): Promise<AdminProblemView> {
  const response = await fetch(url(id), { headers: admin });
  expect(response.status).toBe(200);
  return await response.json() as AdminProblemView;
}

async function report(problem: unknown, { id = SHARED, dryRun = false } = {}): Promise<ProblemWriteReport> {
  const response = await fetch(url(id, dryRun), { method: "PUT", headers: admin, body: JSON.stringify({ problem }) });
  expect(response.status).toBe(200);
  return await response.json() as ProblemWriteReport;
}

async function storedBody(id = SHARED) {
  return (await ProblemModel.findByPk(id))?.body;
}

async function start(competitionId: string) {
  const team = await database.teams.insertTeam({
    teamname: "Alpha", competitionId, email: "", other: "",
    teamId: "8eae8669-125c-42e5-8b49-89afbac31679", joinCode: "111-2222-333",
    credentials: "67676767-6767-4767-a767-676767676767",
  });
  await team.update({ pageState: "RELAY", relayMatchID: "some-match" });
}

const withText = (problem: Problem, hu: string): Problem =>
  ({ ...problem, content: { ...problem.content, hu: { problemText: hu } } });

it("serves a problem with every use a relay makes of it", async () => {
  expect(await view(SHARED)).toEqual({
    problem: shared,
    storedIn: "database",
    answerLocked: false,
    uses: [
      { competitionId: RELAY_ONLY, metadata: sample.competitions[RELAY_ONLY].metadata, position: 1, points: 3 },
      { competitionId: FULL, metadata: sample.competitions[FULL].metadata, position: 2, points: 4 },
    ],
  });
  expect((await view(IN_CODE)).storedIn).toBe("code");
  expect((await fetch(url("zzzzzzzzzz--nincs"), { headers: admin })).status).toBe(404);
});

it("writes a fixed problem, which the relays then read, and nothing on a dry run", async () => {
  const fixed = withText(shared, "Hány kis kockából áll a nagy kocka?");
  expect(await report(fixed, { dryRun: true })).toMatchObject({ written: false, errors: [], warnings: [] });
  expect(await storedBody()).toEqual(sample.problems[SHARED]);

  expect(await report(fixed)).toMatchObject({ written: true, errors: [], warnings: [] });
  expect((await sources.problemSource.getProblems([SHARED])).get(SHARED)).toEqual(fixed);
});

it("refuses an invalid problem with the validator's messages, and one leaving a competition without its language", async () => {
  expect((await report(withText({ ...shared, answer: 1.5 }, " "))).errors).toEqual([
    `feladat ${SHARED}: a válasz (1.5) nem egész szám`,
    `feladat ${SHARED}: a szövege üres (hu)`,
  ]);
  expect((await report({ ...shared, content: { en: shared.content.en } })).errors).toEqual([
    `feladat ${SHARED}: nem maradna szövege a verseny nyelvén (magyar): ${FULL}`,
  ]);
  expect(await storedBody()).toEqual(sample.problems[SHARED]);
});

it("refuses an image not at an https: URL, and saves one on another host with a warning", async () => {
  const withImage = (imageUrl: string): Problem =>
    ({ ...shared, content: { ...shared.content, hu: { problemText: "Mennyi?", imageUrl } } });
  expect((await report(withImage("http://durerinfo.hu/kocka.png"))).errors).toEqual([
    `feladat ${SHARED}: a kép címe nem teljes https:// kezdetű cím (hu): „http://durerinfo.hu/kocka.png”`,
  ]);
  expect(await report(withImage("https://example.org/kocka.png"))).toMatchObject({
    written: true, warnings: [`feladat ${SHARED}: a kép nem a szokásos tárhelyen van (hu): example.org`],
  });
});

it("locks the answer once a team of any competition using the problem has started, the text not", async () => {
  await start(RELAY_ONLY);
  expect((await view(OWN)).answerLocked).toBe(false);
  expect(await report({ ...shared, answer: 28 })).toMatchObject({
    written: false, answerLocked: true,
    errors: [`feladat ${SHARED}: a válasz nem változhat, mert már indult csapat egy versenyben, amely használja (marad: 27)`],
  });
  const text = await report(withText(shared, "Hány kiskockából áll?"));
  expect(text).toMatchObject({ written: true, answerLocked: true });
  expect(text.warnings).toEqual([expect.stringContaining("a futó meccsek a régi változattal")]);
});

it("refuses a problem held in code, and one that changes the id", async () => {
  expect((await report(registry.problems.get(IN_CODE), { id: IN_CODE })).errors)
    .toEqual([`feladat ${IN_CODE}: a kódban tárolt feladat csak telepítéssel változik`]);
  expect((await report({ ...shared, id: "zzzzzzzzzz--masik" })).errors)
    .toEqual([`feladat ${SHARED}: az azonosító nem változhat (a kérésben: zzzzzzzzzz--masik)`]);
});

it("asks for the organisers' login", async () => {
  const response = await fetch(url(SHARED), {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ problem: shared }),
  });
  expect(response.status).toBe(401);
});

async function search(query: Record<string, string>): Promise<ProblemSearchView> {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/problems?${new URLSearchParams(query)}`, { headers: admin });
  expect(response.status).toBe(200);
  return await response.json() as ProblemSearchView;
}

const ids = (view: ProblemSearchView) => view.problems.map(({ problem }) => problem.id);

it("searches the database's problems by id or slug, case ignored, by slug", async () => {
  expect(await search({})).toEqual({ truncated: false, problems: [
    "7q1wniz55w--csomag-haromszog", SHARED, OWN,
  ].map(id => ({ problem: { ...sample.problems[id], id }, storedIn: "database", uses: expect.any(Array) as unknown })) });
  expect(ids(await search({ q: " CSOMAG-KOCKAK " }))).toEqual([SHARED]);
  expect(ids(await search({ q: OWN.split("--")[0] }))).toEqual([OWN]);
  // Held in code, so not the picker's to offer.
  expect(ids(await search({ q: "korongok" }))).toEqual([]);
  expect((await search({ q: "kockak" })).problems[0].uses.map(({ competitionId }) => competitionId))
    .toEqual([RELAY_ONLY, FULL]);
});

it("filters by a competition's relay, in its order, and refuses a competition no one holds", async () => {
  expect(ids(await search({ competition: FULL }))).toEqual([OWN, SHARED]);
  expect(ids(await search({ competition: FULL, q: "paros" }))).toEqual([OWN]);
  // Its in-code problem left out.
  expect(ids(await search({ competition: RELAY_ONLY }))).toEqual([SHARED, "7q1wniz55w--csomag-haromszog"]);
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/problems?competition=zzzzzzzzzz--nincs`, { headers: admin });
  expect(response.status).toBe(404);
  expect((await fetch(`http://127.0.0.1:${port}/team/admin/problems`)).status).toBe(401);
});

it("builds one relay from another's problems, and a fix to a shared one reaches both", async () => {
  const picked = (await search({ competition: FULL, q: "paros" })).problems.map(({ problem }) => problem.id);
  const before = sample.competitions[RELAY_ONLY];
  if (before.relay === undefined) throw new Error("The relay-only competition has a relay");
  const relay = { ...before.relay, problems: [...before.relay.problems, ...picked.map(problemId => ({ problemId, points: 5 }))] };
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${RELAY_ONLY}`, {
    method: "PUT", headers: admin,
    body: JSON.stringify({ competition: { ...before, id: RELAY_ONLY, relay }, problems: [] }),
  });
  expect(await response.json()).toMatchObject({ written: true, errors: [] });

  const own: Problem = { ...sample.problems[OWN], id: OWN };
  const fixed = withText(own, "Hány páros szám van 1 és 100 között?");
  expect(await report(fixed, { id: OWN })).toMatchObject({ written: true });
  expect((await view(OWN)).uses.map(({ competitionId }) => competitionId)).toEqual([RELAY_ONLY, FULL]);
  for (const competitionId of [RELAY_ONLY, FULL]) {
    const competition = await sources.competitionSource.getCompetition(competitionId);
    expect(competition?.relay?.problems.map(({ problemId }) => problemId)).toContain(OWN);
  }
  expect((await sources.problemSource.getProblems([OWN])).get(OWN)).toEqual(fixed);
});
