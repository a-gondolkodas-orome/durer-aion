import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server, State } from "boardgame.io";
import { getFilterPlayerView } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { strategyGames } from "game";
import type { MyGameState } from "game";
import { validatingCompetitionSource } from "problem-bank";
import type { CompetitionConfig, CompetitionSource, Problem, ProblemSource } from "schemas";
import { hostedGames } from "../games";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { import_teams_from_tsv } from "./team_import";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// A competition reaches the server through its source, at any time: the games
// it is played as are hosted for every competition, so nothing is built for
// it when the server starts.

const problem: Problem = { id: "pppppppppp--late", answer: 424242, content: { hu: { problemText: "Hány?" } } };
const competition: CompetitionConfig = {
  id: "llllllllll--late",
  languages: ["hu"],
  relay: { durationMinutes: 40, problems: [{ problemId: problem.id, points: 5 }] },
  strategy: { durationMinutes: 25, gameId: "20o-c" },
  metadata: { kind: "other", label: { hu: "Később érkező" } },
};

// What the source hands out, changed by the tests while the server runs.
const competitions = new Map<string, CompetitionConfig>();
const problems: ProblemSource = {
  getProblems: (ids) => Promise.resolve(new Map(ids.filter(id => id === problem.id).map(id => [id, problem]))),
};
const source: CompetitionSource = validatingCompetitionSource({
  getCompetition: (id) => Promise.resolve(competitions.get(id)),
  listCompetitions: () => Promise.resolve([...competitions.values()]),
}, problems, strategyGames);

const hosted = hostedGames();
let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, hosted.map(({ game }) => game), requireAdmin("unused-here"),
    { competitionSource: source, problemSource: problems });
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

// Each test imports a team of its own: a team plays one match at a time.
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

async function asTeam(teamId: string, method: "GET" | "POST", path: string) {
  return fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { cookie: `${TEAM_COOKIE}=${teamId}` } });
}

async function start(teamId: string, match: "relay" | "strategy"): Promise<string> {
  const response = await asTeam(teamId, "POST", `/team/me/${match}/play`);
  expect(response.status).toBe(200);
  return ((await response.json()) as { matchID: string }).matchID;
}

const minutes = ({ start, end }: { start: string, end: string }) =>
  (new Date(end).getTime() - new Date(start).getTime()) / 60_000;

describe("a competition the source starts returning after the server started", () => {
  beforeAll(() => { competitions.set(competition.id, competition); });
  afterAll(() => { competitions.clear(); });

  it("is served to its team", async () => {
    const response = await asTeam(await importTeam("Alpha"), "GET", "/team/me");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ competition: { id: competition.id } });
  });

  it("plays its relay by its own settings, and keeps them when the competition changes", async () => {
    const matchID = await start(await importTeam("Bravo"), "relay");
    const fetched = await database.db.fetch(matchID, { state: true, metadata: true });
    const state = fetched.state as State<MyGameState>;
    expect(minutes(state.G)).toBe(40);

    // The judge serves the match's first problem, as the transport has it do:
    // with the setup data from the match's metadata.
    const relay = hosted.find(({ game }) => game.name === "relay");
    if (relay === undefined) throw new Error("no relay game is hosted");
    const judge = new relay.bot({ enumerate: () => [] });
    const first = { type: "firstProblem", args: [{ hu: "Hány?" }, [5], { hu: "" }] };
    expect((await judge.play(state as never, "1", fetched.metadata?.setupData)).action.payload).toMatchObject(first);

    // Changed after the start, the competition leaves the match as it began.
    competitions.set(competition.id, { ...competition, relay: { durationMinutes: 90, problems: [] } });
    onTestFinished(() => { competitions.set(competition.id, competition); });
    const later = await database.db.fetch(matchID, { state: true, metadata: true });
    expect(minutes((later.state as State<MyGameState>).G)).toBe(40);
    expect((await judge.play(later.state as never, "1", later.metadata?.setupData)).action.payload).toMatchObject(first);
  });

  it("plays its strategy game for its own duration", async () => {
    const matchID = await start(await importTeam("Charlie"), "strategy");
    const { state, metadata } = await database.db.fetch(matchID, { state: true, metadata: true });
    expect(metadata?.gameName).toBe("strategy--20o-c");
    expect(minutes(state?.G as { start: string, end: string })).toBe(25);
  });
});

// boardgame.io sends a client the match's initial state as it is stored, with
// no playerView applied, when its board connects (`Master.onSync`). So the
// relay's answers must not be anywhere in the state.
it("sends a team that connects to its relay none of the answers", async () => {
  competitions.set(competition.id, competition);
  onTestFinished(() => { competitions.clear(); });
  const teamId = await importTeam("Delta");
  const matchID = await start(teamId, "relay");
  const relay = hosted.find(({ game }) => game.name === "relay")?.game;
  if (relay === undefined) throw new Error("no relay game is hosted");

  const sent: unknown[] = [];
  const filter = getFilterPlayerView(relay);
  const master = new Master(relay, database.db, {
    send: ({ playerID, ...data }) => { sent.push(filter(playerID, data)); },
    sendAll: () => undefined,
  });
  await master.onSync(matchID, "0", teamId, 2);
  expect(sent).toHaveLength(1);
  expect(JSON.stringify(sent)).not.toContain(String(problem.answer));
});
