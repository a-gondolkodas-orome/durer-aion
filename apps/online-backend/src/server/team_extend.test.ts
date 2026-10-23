import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { Sequelize } from "sequelize";
import type { AnyBgioGame } from "game";
import type { TeamsRepository } from "./db";
import { TeamModel, teamAttributes } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const RELAY_ID = "0EKBiMgbJ5A";
const STRATEGY_ID = "k3Jd9QpL2xZ";
const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

// As in team_reset.test.ts: a real model over a Sequelize never connected,
// with `save` reduced to the validation it runs first.
const sequelize = new Sequelize("db", "user", "password", { dialect: "postgres", logging: false });
TeamModel.init(teamAttributes, { sequelize, tableName: "Teams" });

function teamRow(pageState: TeamModel["pageState"]) {
  const row = TeamModel.build({
    teamId: TEAM_ID,
    joinCode: "000-0000-000",
    teamName: "Alpha",
    category: "C",
    credentials: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b",
    email: "team@example.com",
    pageState,
    relayMatchID: RELAY_ID,
    strategyMatchID: STRATEGY_ID,
    other: "",
  });
  vi.spyOn(row, "save").mockImplementation(async function (this: TeamModel) {
    await this.validate();
    return this;
  });
  return row;
}

function matchState(end: string) {
  return {
    G: {
      start: "2026-03-21T10:30:00.000Z", end, points: 0,
      liveResults: [], difficulty: null, winner: null,
      maxPointsList: [], previousPoints: [], previousAnswers: [],
    },
    ctx: { phase: "play" },
    _stateID: 7,
  };
}

const PAST = "2026-03-21T11:00:00.000Z";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /game/admin/:matchId/addminutes/:minutes", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  /** Serves the route over `team`, whose two matches both timed out. */
  async function serve(team: TeamModel) {
    const teams = { getTeam: vi.fn().mockResolvedValue(team) } as unknown as TeamsRepository;
    const states: Record<string, ReturnType<typeof matchState>> = {
      [RELAY_ID]: matchState(PAST),
      [STRATEGY_ID]: matchState(PAST),
    };
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    app.silent = true;
    app.context.db = {
      fetch: (matchID: string) => ({
        state: states[matchID],
        metadata: { gameName: "game", players: { 0: { name: TEAM_ID } } },
      }),
      setState: (matchID: string, state: ReturnType<typeof matchState>) => { states[matchID] = state; },
    } as unknown as Server.AppCtx["db"];
    Object.assign(app.context, { durer_transport: { pubSub: { publish: vi.fn() } } });
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [{ name: "game" } as AnyBgioGame], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (matchID: string) => fetch(
      `http://127.0.0.1:${port}/game/admin/${matchID}/addminutes/5`,
      { method: "POST", headers: { authorization: CREDENTIALS } },
    );
  }

  // The regression: the team's page decides what its client shows, so a team
  // that went home after the buzzer was left on a home page with a running
  // match it could neither enter nor leave to start its other one.
  it("takes a team that went home back to the match it extends", async () => {
    const team = teamRow("HOME");
    const extend = await serve(team);

    const response = await extend(RELAY_ID);

    expect(response.status).toBe(200);
    expect(team.pageState).toBe("RELAY");
    expect(team.save).toHaveBeenCalledOnce();
  });

  it("moves a team still on its other, finished match's page", async () => {
    const team = teamRow("RELAY");
    const extend = await serve(team);

    const response = await extend(STRATEGY_ID);

    expect(response.status).toBe(200);
    expect(team.pageState).toBe("STRATEGY");
  });
});
