import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server, State } from "boardgame.io";
import { strategyGames } from "game";
import type { MyGameState } from "game";
import { createRegistry, validatingCompetitionSource } from "problem-bank";
import { registry as allBanks } from "problem-bank/all";
import type { CompetitionConfig, CompetitionSource, Problem } from "schemas";
import { hostedGames } from "../games";
import { requireAdmin } from "./admin_session";
import { openContentSources } from "./database_sources";
import { CompetitionModel, ProblemModel } from "./model";
import { configureTeamsRouter } from "./router";
import { import_teams_from_tsv } from "./team_import";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// Competitions and problems the suite writes to the database's tables, served
// beside the ones in code (#812).

const problem: Problem = { id: "pppppppppp--tarolt", answer: 515151, content: { hu: { problemText: "Mennyi?" } } };
const competition: CompetitionConfig = {
  id: "dddddddddd--tarolt",
  languages: ["hu"],
  relay: { durationMinutes: 35, problems: [{ problemId: problem.id, points: 6 }] },
  strategy: { durationMinutes: 15, gameId: "minta-ketkupac" },
  metadata: { kind: "other", label: { hu: "Adatbázisból" } },
};

/** One bank of the code: a problem, and a competition whose relay uses it. */
const inCode = createRegistry([{
  problems: { "cccccccccc--kodban": { answer: 7, content: { hu: { problemText: "Hét?" } } } },
  competitions: {
    "kkkkkkkkkk--kodban": {
      languages: ["hu"],
      relay: { durationMinutes: 60, problems: [{ problemId: "cccccccccc--kodban", points: 3 }] },
      metadata: { kind: "other", label: { hu: "Kódból" } },
    },
  },
}]);

async function writeRows() {
  const { id: problemId, ...problemBody } = problem;
  const { id: competitionId, ...competitionBody } = competition;
  await ProblemModel.create({ id: problemId, body: problemBody, createdBy: null });
  await CompetitionModel.create({ id: competitionId, body: competitionBody, createdBy: null });
}

const hosted = hostedGames();
let database: Awaited<ReturnType<typeof startTestDatabase>>;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
}, 30_000);

afterAll(async () => {
  await database?.stop();
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  await database.reset();
});

describe("openContentSources", () => {
  it("serves the database's competitions and problems beside the code's", async () => {
    await writeRows();
    const { competitionSource, problemSource } = await openContentSources(database.teams, inCode);
    expect(await competitionSource.getCompetition(competition.id)).toEqual(competition);
    expect((await competitionSource.listCompetitions()).map(({ id }) => id))
      .toEqual(["kkkkkkkkkk--kodban", competition.id]);
    expect(await problemSource.getProblems([problem.id, "cccccccccc--kodban"]))
      .toEqual(new Map([[problem.id, problem], ["cccccccccc--kodban", inCode.problems.get("cccccccccc--kodban")]]));
  });

  it.each([
    ["a problem", () => ProblemModel.create({ id: "cccccccccc--kodban", body: { answer: 1, content: { hu: { problemText: "?" } } }, createdBy: null })],
    ["a competition", () => CompetitionModel.create({ id: "kkkkkkkkkk--kodban", body: competition, createdBy: null })],
    // A problem and a competition never share an id either (validateRegistry).
    ["a problem under a competition's id", () => ProblemModel.create({ id: "kkkkkkkkkk--kodban", body: problem, createdBy: null })],
  ])("refuses to open with %s whose id the code holds, naming it", async (_, write) => {
    const id = (await write()).id;
    await expect(openContentSources(database.teams, inCode)).rejects.toThrow(id);
  });

  it("refuses a competition whose stored problem breaks the rules", async () => {
    await writeRows();
    await ProblemModel.update({ body: { ...problem, answer: 1.5 } }, { where: { id: problem.id } });
    const { competitionSource } = await openContentSources(database.teams, inCode);
    await expect(competitionSource.getCompetition(competition.id)).rejects.toThrow(problem.id);
    // The list leaves it out, and logs why.
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await competitionSource.listCompetitions()).map(({ id }) => id)).toEqual(["kkkkkkkkkk--kodban"]);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining(problem.id));
  });

  it("refuses a stored competition that breaks the rules", async () => {
    await writeRows();
    await CompetitionModel.update({ body: { ...competition, strategy: { durationMinutes: 15, gameId: "nincs-ilyen" } } },
      { where: { id: competition.id } });
    const { competitionSource } = await openContentSources(database.teams, inCode);
    await expect(competitionSource.getCompetition(competition.id)).rejects.toThrow(competition.id);
  });

  it("with empty tables, serves exactly what the code alone does", async () => {
    const { competitionSource, problemSource } = await openContentSources(database.teams, allBanks);
    const codeAlone = validatingCompetitionSource(allBanks.competitionSource, allBanks.problemSource, strategyGames);
    expect(await competitionSource.listCompetitions()).toEqual(await codeAlone.listCompetitions());
    const ids = [...allBanks.problems.keys()];
    expect(await problemSource.getProblems(ids)).toEqual(await allBanks.problemSource.getProblems(ids));
  });
});

it("refuses a malformed id in the tables", async () => {
  await expect(ProblemModel.create({ id: "nem-azonosito", body: problem, createdBy: null }))
    .rejects.toMatchObject({ name: "SequelizeValidationError" });
});

describe("a competition held in the database", () => {
  let server: http.Server;
  let port: number;
  let source: CompetitionSource;

  beforeEach(async () => {
    await writeRows();
    const sources = await openContentSources(database.teams, inCode);
    source = sources.competitionSource;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    app.silent = true;
    app.context.db = database.db;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, database.teams, hosted.map(({ game }) => game), requireAdmin("unused-here"), sources);
    app.use(router.routes());
    const handle = app.callback();
    server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise(resolve => server?.close(resolve));
  });

  async function importTeam(name: string): Promise<string> {
    const file = join(mkdtempSync(join(tmpdir(), "teams-")), "teams.tsv");
    writeFileSync(file, `Teamname\tCompetition\n${name}\t${competition.id}\n`);
    const { successful } = await import_teams_from_tsv(database.teams, file, source);
    expect(successful).toBe(1);
    const team = (await database.teams.listTeams())?.find(({ teamName }) => teamName === name);
    if (team === undefined) throw new Error(`${name} was not imported`);
    await team.update({ pageState: "HOME" });
    return team.teamId;
  }

  async function start(teamId: string, match: "relay" | "strategy"): Promise<string> {
    const response = await fetch(`http://127.0.0.1:${port}/team/me/${match}/play`,
      { method: "POST", headers: { cookie: `${TEAM_COOKIE}=${teamId}` } });
    expect(response.status).toBe(200);
    return ((await response.json()) as { matchID: string }).matchID;
  }

  const minutes = ({ start, end }: { start: string, end: string }) =>
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000;

  it("plays its relay with its stored problem", async () => {
    const matchID = await start(await importTeam("Alpha"), "relay");
    const fetched = await database.db.fetch(matchID, { state: true, metadata: true });
    const state = fetched.state as State<MyGameState>;
    expect(minutes(state.G)).toBe(35);

    const relay = hosted.find(({ game }) => game.name === "relay");
    if (relay === undefined) throw new Error("no relay game is hosted");
    const judge = new relay.bot({ enumerate: () => [] });
    const first = { type: "firstProblem", args: [{ hu: "Mennyi?" }, [6], { hu: "" }] };
    expect((await judge.play(state as never, "1", fetched.metadata?.setupData)).action.payload).toMatchObject(first);
  });

  it("plays its strategy game for its stored duration", async () => {
    const matchID = await start(await importTeam("Bravo"), "strategy");
    const { state, metadata } = await database.db.fetch(matchID, { state: true, metadata: true });
    expect(metadata?.gameName).toBe("strategy--minta-ketkupac");
    expect(minutes(state?.G as { start: string, end: string })).toBe(15);
  });
});
