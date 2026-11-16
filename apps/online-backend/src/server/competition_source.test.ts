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

const problem: Problem = { id: "pppppppppp--late", answer: 12, content: { hu: { problemText: "Hány?" } } };
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

async function importTeam(): Promise<string> {
  const file = join(mkdtempSync(join(tmpdir(), "teams-")), "teams.tsv");
  writeFileSync(file, `Teamname\tCompetition\nAlpha\t${competition.id}\n`);
  const { successful } = await import_teams_from_tsv(database.teams, file, source);
  expect(successful).toBe(1);
  const [team] = (await database.teams.listTeams()) ?? [];
  await team.update({ pageState: "HOME" });
  return team.teamId;
}

async function startRelay(teamId: string): Promise<string> {
  const response = await fetch(`http://127.0.0.1:${port}/team/me/relay/play`, {
    method: "POST",
    headers: { cookie: `${TEAM_COOKIE}=${teamId}` },
  });
  expect(response.status).toBe(200);
  return ((await response.json()) as { matchID: string }).matchID;
}

it("imports into and plays a competition the source starts returning after the server started", async () => {
  competitions.set(competition.id, competition);
  const matchID = await startRelay(await importTeam());

  const state = (await database.db.fetch(matchID, { state: true })).state as State<MyGameState>;
  const { G } = state;
  expect(new Date(G.end).getTime() - new Date(G.start).getTime()).toBe(40 * 60_000);

  // The judge serves the match's first problem.
  const relay = hosted.find(({ game }) => game.name === "relay");
  if (relay === undefined) throw new Error("no relay game is hosted");
  const judge = new relay.bot({ enumerate: () => [] });
  const { action } = await judge.play(state as never, "1");
  expect(action.payload).toMatchObject({ type: "firstProblem", args: [{ hu: "Hány?" }, [5], { hu: "" }] });

  // Changed after the start, the competition leaves the match as it began.
  competitions.set(competition.id, { ...competition, relay: { durationMinutes: 90, problems: [] } });
  const { state: later } = await database.db.fetch(matchID, { state: true });
  expect((await judge.play(later as never, "1")).action.payload).toMatchObject({ args: [{ hu: "Hány?" }, [5], { hu: "" }] });
});
