import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server, StorageAPI } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { MINUTES_LIMIT } from "./add_minutes";
import { configureTeamsRouter } from "./router";

const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

const MATCH = "0EKBiMgbJ5A";
const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const START = "2026-03-21T18:00:00.000Z";
const END = "2026-03-21T19:00:00.000Z";

const team = (fields: Partial<TeamModel> = {}) =>
  ({
    teamId: TEAM_ID,
    teamName: "Alpha",
    other: "",
    relayMatch: { state: "IN PROGRESS", matchID: MATCH, startAt: new Date(START), endAt: new Date(END) },
    strategyMatch: { state: "NOT STARTED" },
    update: vi.fn().mockResolvedValue(undefined),
    ...fields,
  }) as unknown as TeamModel;

// The route over HTTP, the way admin_session.test.ts serves it. The walk itself
// is add_minutes.test.ts'; what this is about is the body the route accepts.
describe("POST /game/admin/addminutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
    vi.restoreAllMocks();
  });

  async function serve(rows: TeamModel[] = []) {
    const teams = { listTeams: vi.fn().mockResolvedValue(rows) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 400s are what this file is about, and koa logs every error it writes.
    app.silent = true;
    app.context.db = { fetch: vi.fn(), setState: vi.fn() } as unknown as StorageAPI.Async;
    app.context.durer_transport = { getMatchQueue: () => ({ add: (task: () => unknown) => task() }), pubSub: {} };
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (body: unknown, auth = CREDENTIALS) => fetch(`http://127.0.0.1:${port}/game/admin/addminutes`, {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("asks for the organisers' password", async () => {
    const request = await serve();

    expect((await request({ minutes: 10, grant: "a1b2c3d4" }, "")).status).toBe(401);
  });

  it("answers the walk's result for a well formed grant", async () => {
    const request = await serve();

    const response = await request({ minutes: 10, grant: "a1b2c3d4" });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ extended: [], alreadyGranted: [], problems: [] });
  });

  // A non-number used to reach `setMinutes`, where it becomes an Invalid Date
  // and throws on the way out of `toISOString` — a 500 for a typo. The three
  // after the fraction are what `Number` alone let through: it reads `null`
  // and `[]` as nought and `true` as one, so a body nobody meant extended
  // every running match by a number nobody typed. A whole number is not enough
  // either: `Number.isInteger(1e21)` is true, and 1e21 minutes is that same
  // Invalid Date.
  it.each([
    ["no minutes", { grant: "a1b2c3d4" }],
    ["minutes that are not a number", { minutes: "soon", grant: "a1b2c3d4" }],
    ["a fractional number of minutes", { minutes: 1.5, grant: "a1b2c3d4" }],
    ["minutes sent as a string", { minutes: "10", grant: "a1b2c3d4" }],
    ["null minutes", { minutes: null, grant: "a1b2c3d4" }],
    ["minutes sent as a boolean", { minutes: true, grant: "a1b2c3d4" }],
    ["minutes sent as an array", { minutes: [], grant: "a1b2c3d4" }],
    ["minutes no date can hold", { minutes: 1e21, grant: "a1b2c3d4" }],
    ["more minutes than the bound", { minutes: MINUTES_LIMIT + 1, grant: "a1b2c3d4" }],
    ["more minutes taken back than the bound", { minutes: -MINUTES_LIMIT - 1, grant: "a1b2c3d4" }],
    ["no grant", { minutes: 10 }],
    ["an empty grant", { minutes: 10, grant: "" }],
    ["a grant that is not a string", { minutes: 10, grant: 7 }],
    // `other` has a length, and a note too long to fit is not written at all —
    // which would leave the retry it exists for applying a second time.
    ["a grant too long for the team's notes", { minutes: 10, grant: "a".repeat(33) }],
    // The note is delimited by these, so a grant carrying them runs into it.
    ["a grant with a space in it", { minutes: 10, grant: "a1b2 c3d4" }],
    ["a grant with a bracket in it", { minutes: 10, grant: "a1b2]c3d4" }],
  ])("refuses %s", async (_case, body) => {
    const request = await serve();

    expect((await request(body)).status).toBe(400);
  });

  // Taking time back is the same operation, and the organisers use it.
  it("takes a negative number of minutes", async () => {
    const request = await serve();

    expect((await request({ minutes: -10, grant: "a1b2c3d4" })).status).toBe(200);
  });

  it("takes the bound itself", async () => {
    const request = await serve();

    expect((await request({ minutes: MINUTES_LIMIT, grant: "a1b2c3d4" })).status).toBe(200);
  });
});

// The route this one was split out of. Its minutes come from the path, where
// anything that is not a whole number used to reach `setMinutes` the same way.
describe("POST /game/admin/:matchId/addminutes/:minutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
    vi.restoreAllMocks();
  });

  async function serve(row: TeamModel | null = null) {
    const teams = { getTeam: vi.fn().mockResolvedValue(row) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    app.silent = true;
    // With no team, storage holding no match: a request that gets past the path
    // is a 404, which tells "refused the minutes" from "went on to look".
    app.context.db = {
      fetch: vi.fn().mockResolvedValue(row === null ? {} : {
        state: { _stateID: 7, G: { start: START, end: END }, ctx: {} },
        metadata: { gameName: "relay_c", players: [{ name: TEAM_ID }] },
      }),
      setState: vi.fn(),
    } as unknown as StorageAPI.Async;
    app.context.durer_transport = { getMatchQueue: () => ({ add: (task: () => unknown) => task() }), pubSub: {} };
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (minutes: string, matchID = "a-match") =>
      fetch(`http://127.0.0.1:${port}/game/admin/${matchID}/addminutes/${minutes}`, {
        method: "POST",
        headers: { authorization: CREDENTIALS },
      });
  }

  it.each(["soon", "1.5", "1e3", "0x10", "9".repeat(30), `${MINUTES_LIMIT + 1}`])(
    "refuses %s minutes", async (minutes) => {
      const request = await serve();

      expect((await request(minutes)).status).toBe(400);
    });

  it.each(["10", "-10"])("goes on to look for the match for %s minutes", async (minutes) => {
    const request = await serve();

    expect((await request(minutes)).status).toBe(404);
  });

  // Both of these are 501, and they mean different things to an organiser, so
  // the status alone cannot pick what the page says. The kind travels with it,
  // the same kinds the bulk walk reports (#507).
  it("says which refusal a 501 was, not just that it refused", async () => {
    const request = await serve(team());

    const response = await request("10", "an-older-match");

    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({ kind: "other-match-running", running: MATCH });
  });

  it("says so when the team has no match running at all", async () => {
    const request = await serve(team({ relayMatch: { state: "NOT STARTED" } }));

    const response = await request("10");

    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({ kind: "no-match-running" });
  });

  // The other refusals keep the statuses they answered before. The router is
  // configured with no games here, so the lookup refuses whatever it is told.
  it("still 404s a game no registry has", async () => {
    const request = await serve(team());

    const response = await request("10", MATCH);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ kind: "game-not-found" });
  });
});
