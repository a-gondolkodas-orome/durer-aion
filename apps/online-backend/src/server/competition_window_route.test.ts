import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { GameRelay } from "game";
import { relayGameName } from "schemas";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { TEAM_COOKIE } from "./team_session";
import { startTestDatabase } from "./test_database";

// A competition's window set on the admin page, against a real postgres: it is
// stored, served to the admin page and the team, and holds the team's starts.

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const COMPETITION_ID = "mkhi1nnoim--20-online-c";
const PASSWORD = "organiser-password";
const ADMIN = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
const FUTURE = { opensAt: "2099-01-01T00:00+01:00", closesAt: "2099-01-01T21:00+01:00" };

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let server: http.Server;
let port: number;

beforeAll(async () => {
  vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");
  database = await startTestDatabase();
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // Koa would log the refusals under test.
  app.silent = true;
  app.context.db = database.db;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, database.teams, [{ ...GameRelay, name: relayGameName(COMPETITION_ID) }],
    requireAdmin(PASSWORD));
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
  const team = await database.teams.insertTeam({
    teamname: "Alpha",
    competitionId: COMPETITION_ID,
    category: "C",
    email: "team@example.com",
    other: "",
    teamId: TEAM_ID,
    joinCode: "111-2222-333",
    credentials: "67676767-6767-4767-a767-676767676767",
  });
  await team.update({ pageState: "HOME" });
});

const setWindow = (body: unknown, competitionId = COMPETITION_ID) =>
  fetch(`http://127.0.0.1:${port}/team/admin/competitions/${competitionId}/start-window`, {
    method: "PUT",
    headers: { authorization: ADMIN, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const competitionWindow = async () => {
  const answer = await fetch(`http://127.0.0.1:${port}/team/admin/competitions`, { headers: { authorization: ADMIN } });
  const competitions = await answer.json() as { id: string, startWindow: unknown, configStartWindow: unknown }[];
  return competitions.find(({ id }) => id === COMPETITION_ID);
};

const asTeam = { cookie: `${TEAM_COOKIE}=${TEAM_ID}` };

it("holds the competition's teams to the window an organiser sets", async () => {
  expect((await setWindow(FUTURE)).status).toBe(204);

  expect(await competitionWindow()).toMatchObject({ startWindow: FUTURE, configStartWindow: null });
  const view = await (await fetch(`http://127.0.0.1:${port}/team/me`, { headers: asTeam })).json() as
    { startWindow: unknown };
  expect(view.startWindow).toStrictEqual(FUTURE);
  const started = await fetch(`http://127.0.0.1:${port}/team/me/relay/play`, { method: "POST", headers: asTeam });
  expect(started.status).toBe(403);
});

it("returns the competition to its config's window on a null opensAt", async () => {
  await setWindow(FUTURE);

  expect((await setWindow({ opensAt: null })).status).toBe(204);

  expect(await competitionWindow()).toMatchObject({ startWindow: null, configStartWindow: null });
  const started = await fetch(`http://127.0.0.1:${port}/team/me/relay/play`, { method: "POST", headers: asTeam });
  expect(started.status).toBe(200);
});

it("refuses a window the rules refuse, and a competition the server does not have", async () => {
  expect((await setWindow({ opensAt: "2099-01-01T00:00" })).status).toBe(400);
  expect((await setWindow(FUTURE, "nonexistent--competition")).status).toBe(404);
  expect(await competitionWindow()).toMatchObject({ startWindow: null });
});

it("is for organisers only", async () => {
  const answer = await fetch(`http://127.0.0.1:${port}/team/admin/competitions/${COMPETITION_ID}/start-window`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(FUTURE),
  });
  expect(answer.status).toBe(401);
});
