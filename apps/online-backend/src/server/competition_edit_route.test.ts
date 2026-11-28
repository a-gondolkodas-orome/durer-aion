import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
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

// PUT /team/admin/competitions/:id over HTTP against PGlite (#817, #819): a
// database competition's settings are replaced whole, with the new problems
// its relay brings, validated, and locked where a started team needs them to
// stay.

const sample = JSON.parse(readFileSync(
  join(__dirname, "..", "..", "..", "..", "packages", "problem-bank", "fixtures", "sample-bundle.json"), "utf8",
)) as Bundle;
const FULL = "aqvco71pta--csomag-teljes";
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

async function put(competition: unknown,
  { id = FULL, dryRun = false, problems }: { id?: string, dryRun?: boolean, problems?: unknown } = {}) {
  return await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${id}${dryRun ? "?dryRun=1" : ""}`, {
    method: "PUT", headers: admin, body: JSON.stringify({ competition, problems }),
  });
}

async function report(competition: unknown, options?: { dryRun?: boolean, problems?: unknown }): Promise<CompetitionWriteReport> {
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

it("drops a window set apart from the competition, so the one saved with it is the one in force", async () => {
  await database.teams.setCompetitionWindow(FULL, { opensAt: "2099-02-01T14:00+01:00" });
  expect((await report(changed)).written).toBe(true);
  expect((await database.teams.competitionWindows()).has(FULL)).toBe(false);
});

it("refuses a competition no one holds", async () => {
  const missing = await put({ ...stored, id: "zzzzzzzzzz--nincs" }, { id: "zzzzzzzzzz--nincs" });
  expect(missing.status).toBe(404);
});

it("asks for the organisers' login", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${FULL}`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ competition: stored }),
  });
  expect(response.status).toBe(401);
});

describe("composing the relay", () => {
  const PAROS = "roow9oo75t--csomag-paros";
  const KOCKAK = "10iqp4vy6b--csomag-kockak";
  const HAROMSZOG = "7q1wniz55w--csomag-haromszog";
  const RELAY_ONLY = "903xajr9et--csomag-valto";
  const fresh: Problem = { id: "n3wpr0b1em--uj-feladat", answer: 7, content: { hu: { problemText: "Mennyi $3 + 4$?" } } };
  const withRelay = (problems: { problemId: string, points: number }[]): CompetitionConfig =>
    ({ ...stored, relay: { ...relay, problems } });
  const servedRelay = async (id: string) => {
    const served = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${id}`, { headers: admin });
    return (await served.json() as { competition: CompetitionConfig }).competition.relay?.problems;
  };

  it("reorders, re-points and drops the relay's problems, and serves them so", async () => {
    const reordered = [{ problemId: KOCKAK, points: 5 }, { problemId: HAROMSZOG, points: 2 }];
    expect(await report(withRelay(reordered))).toMatchObject({ written: true, errors: [] });
    expect(await servedRelay(FULL)).toEqual(reordered);
    // Dropped from the relay only: the problem stays, for whatever else uses it.
    expect(await ProblemModel.findByPk(PAROS)).not.toBeNull();
  });

  it("writes a new problem with the relay that uses it, and nothing of it on a dry run", async () => {
    const competition = withRelay([...relay.problems, { problemId: fresh.id, points: 6 }]);
    expect(await report(competition, { dryRun: true, problems: [fresh] }))
      .toEqual({ written: false, errors: [], warnings: [], started: false });
    expect(await ProblemModel.findByPk(fresh.id)).toBeNull();

    expect(await report(competition, { problems: [fresh] })).toMatchObject({ written: true, errors: [] });
    expect((await ProblemModel.findByPk(fresh.id))?.body).toEqual({ ...fresh, id: undefined });
    expect(await servedRelay(FULL)).toEqual(competition.relay?.problems);
  });

  it("leaves the other competitions using a shared problem as they are when one relay takes a copy", async () => {
    const shared = sample.problems[KOCKAK];
    const copy: Problem = { ...shared, id: "c0pyc0pyc0--csomag-kockak", answer: shared.answer + 1 };
    const otherBefore = await servedRelay(RELAY_ONLY);
    expect(otherBefore).toContainEqual(expect.objectContaining({ problemId: KOCKAK }));
    const competition = withRelay(relay.problems.map(each => each.problemId === KOCKAK ? { ...each, problemId: copy.id } : each));
    expect(await report(competition, { problems: [copy] })).toMatchObject({ written: true, errors: [] });
    expect(await servedRelay(RELAY_ONLY)).toEqual(otherBefore);
    expect((await ProblemModel.findByPk(KOCKAK))?.body).toEqual(shared);
  });

  it("refuses a new problem that breaks the rules, is not in the relay, or has an id already taken", async () => {
    const invalid = { ...fresh, content: { hu: { problemText: " ", imageUrl: "http://pelda.hu/a.png" } } };
    const unused: Problem = { ...fresh, id: "n0tus3d000--nem-hasznalt" };
    const taken: Problem = { ...fresh, id: HAROMSZOG };
    const competition = withRelay([...relay.problems, { problemId: fresh.id, points: 6 }, { problemId: HAROMSZOG, points: 1 }]);
    const answer = await report(competition, { problems: [invalid, unused, taken] });
    expect(answer.written).toBe(false);
    expect(answer.errors).toEqual([
      `feladat ${fresh.id}: a szövege üres (hu)`,
      `feladat ${fresh.id}: a kép címe nem teljes https:// kezdetű cím (hu): „http://pelda.hu/a.png”`,
      `feladat ${unused.id}: új feladat, de a váltó nem használja`,
      `feladat ${HAROMSZOG}: ez az azonosító az adatbázisban már egy feladaté`,
    ]);
    expect(await ProblemModel.findByPk(fresh.id)).toBeNull();
    expect(await storedBody()).toEqual(sample.competitions[FULL]);
  });

  it("refuses new problems once a team has started, with the relay's lock", async () => {
    await startRelay();
    const answer = await report(withRelay([...relay.problems, { problemId: fresh.id, points: 6 }]), { problems: [fresh] });
    expect(answer).toMatchObject({ written: false, started: true });
    expect(answer.errors).toEqual(
      ["A váltó feladatai, sorrendjük és pontjuk nem változhat: már indult csapat ebben a versenyben."]);
    expect(await ProblemModel.findByPk(fresh.id)).toBeNull();
    const served = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${FULL}`, { headers: admin });
    expect((await served.json() as { started: boolean }).started).toBe(true);
  });

  it("refuses new problems that are not a list of objects, or name one id twice", async () => {
    expect((await report(stored, { problems: { [fresh.id]: fresh } })).errors)
      .toEqual(["A kérés nem egy { competition, problems } objektum."]);
    expect((await report(withRelay([{ problemId: fresh.id, points: 1 }]), { problems: [fresh, fresh] })).errors)
      .toEqual([`feladat ${fresh.id}: kétszer is szerepel az új feladatok között`]);
  });
});
