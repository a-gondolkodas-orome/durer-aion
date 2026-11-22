import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { registry } from "problem-bank/all";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const MATCH_ID = "0EKBiMgbJ5A";
const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
const GAME_NAME = "a-hosted-game";

interface SerialQueue { add<T>(job: () => Promise<T>): Promise<T> }

/** One job at a time, in order: what boardgame.io's per-match queue is. */
function serialQueue(): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    add<T>(job: () => Promise<T>): Promise<T> {
      const run = tail.then(job);
      tail = run.catch(() => undefined);
      return run;
    },
  };
}

// A match the route may not extend is a conflict with the match's state, not
// a route the server lacks: 409, with a code saying which conflict.
describe("POST /game/admin/:matchId/addminutes/:minutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  const setState = vi.fn();
  afterEach(() => { setState.mockReset(); });

  async function serve(
    team: Partial<TeamModel>,
    end: string,
    { db, queue = serialQueue(), games = [] }: { db?: unknown; queue?: SerialQueue; games?: { name: string }[] } = {},
  ) {
    const teams = { getTeam: vi.fn().mockResolvedValue(team) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    const state = { G: { start: "2001-01-01T00:00:00Z", end, points: 0 }, ctx: {}, _stateID: 0 };
    const metadata = { players: { 0: { name: TEAM_ID } }, gameName: GAME_NAME };
    app.context.db = (db ?? { fetch: () => ({ state, metadata }), setState }) as Server.AppCtx["db"];
    // What the route takes from the socket transport: the match's queue, and
    // the channel a match's updates are published on.
    Object.assign(app.context, { durer_transport: { getMatchQueue: () => queue, pubSub: { publish: vi.fn() } } });
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, games as never, requireAdmin(PASSWORD), registry);
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return fetch(
      `http://127.0.0.1:${port}/game/admin/${MATCH_ID}/addminutes/5`,
      { method: "POST", headers: { authorization: CREDENTIALS } },
    );
  }

  it("refuses a match that is no longer the team's", async () => {
    const response = await serve({ relayMatchID: "another", strategyMatchID: null }, "2099-01-01T00:00:00Z");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "STALE_MATCH_ID" });
  });

  it("refuses a match that is over", async () => {
    const response = await serve({ relayMatchID: null, strategyMatchID: MATCH_ID }, "2001-01-01T01:00:00Z");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "MATCH_FINISHED" });
  });

  // A match stored under a game name the server no longer hosts, such as one
  // started before the games were renamed (#797).
  it("refuses a running match no hosted game plays, and leaves its time alone", async () => {
    const response = await serve({ relayMatchID: MATCH_ID, strategyMatchID: null }, "2099-01-01T00:00:00Z");

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "GAME_NOT_FOUND" });
    expect(setState).not.toHaveBeenCalled();
  });

  // A move on the match's queue reads the stored state, then writes it with
  // the next state ID. An extension built from that same state claims the same
  // ID, and bgio-postgres keeps only the first of two such writes (#655).
  it("waits for a move in flight, and keeps both it and the extension", async () => {
    let stored = { G: { start: "2001-01-01T00:00:00Z", end: "2099-01-01T00:00:00.000Z", points: 0, moved: false }, ctx: {}, _stateID: 0 };
    const metadata = { players: { 0: { name: TEAM_ID } }, gameName: GAME_NAME };
    const db = {
      fetch: () => ({ state: structuredClone(stored), metadata }),
      // bgio-postgres's rule: a write lands only over a lower state ID.
      setState: (_matchID: string, state: typeof stored) => { if (state._stateID > stored._stateID) stored = state; },
    };
    const queue = serialQueue();
    let finishMove: () => void = () => undefined;
    const moveDone = queue.add(async () => {
      const read = db.fetch().state;
      await new Promise<void>(resolve => { finishMove = resolve; });
      db.setState(MATCH_ID, { ...read, G: { ...read.G, moved: true }, _stateID: read._stateID + 1 });
    });

    const response = serve(
      { relayMatchID: MATCH_ID, strategyMatchID: null, other: "", save: vi.fn(), toJSON: () => ({}) },
      stored.G.end,
      { db, queue, games: [{ name: GAME_NAME }] },
    );
    // Long enough for an unqueued route to read and write.
    await new Promise(resolve => setTimeout(resolve, 100));
    finishMove();
    await moveDone;

    expect((await response).status).toBe(200);
    expect(stored._stateID).toBe(2);
    expect(stored.G.moved).toBe(true);
    expect(stored.G.end).toBe("2099-01-01T00:05:00.000Z");
  });
});
