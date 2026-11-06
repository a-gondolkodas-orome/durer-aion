import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { Sequelize } from "sequelize";
import type { TeamsRepository } from "./db";
import { OTHER_IMPORT_MAX_LENGTH, OTHER_MAX_LENGTH, TeamModel, teamAttributes } from "./model";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const MATCH_ID = "0EKBiMgbJ5A";
const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

// A real model over a postgres Sequelize that is never connected, as
// model.test.ts uses. `save` is the only call that would
// reach a database, and it is replaced by the validation it runs first — which
// is the whole point here: the route's write used to be refused by the `other`
// column's own validator, and a stub row would not have noticed.
const sequelize = new Sequelize("db", "user", "password", { dialect: "postgres", logging: false });
TeamModel.init(teamAttributes, { sequelize, tableName: "Teams" });

function teamRow(other: string, pageState: TeamModel["pageState"] = "STRATEGY") {
  const row = TeamModel.build({
    teamId: TEAM_ID,
    joinCode: "000-0000-000",
    teamName: "Alpha",
    category: "C",
    credentials: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b",
    email: "team@example.com",
    pageState,
    relayMatchID: MATCH_ID,
    strategyMatchID: MATCH_ID,
    other,
  });
  vi.spyOn(row, "save").mockImplementation(async function (this: TeamModel) {
    await this.validate();
    return this;
  });
  return row;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /team/admin/:teamID/reset/:game", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(team: TeamModel | null) {
    const teams = { getTeam: vi.fn().mockResolvedValue(team) } as unknown as TeamsRepository;
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // A refused reset is one of the answers under test, and koa logs every
    // error it writes.
    app.silent = true;
    // The route answers with the team's matches, read off the one left running.
    const running = { G: { start: new Date().toISOString(), end: "2099-01-01T00:00:00Z", points: 0 }, ctx: {} };
    app.context.db = { fetch: () => ({ state: running }) } as unknown as Server.AppCtx["db"];
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (game: "strategy" | "relay") => fetch(
      `http://127.0.0.1:${port}/team/admin/${TEAM_ID}/reset/${game}`,
      { method: "POST", headers: { authorization: CREDENTIALS } },
    );
  }

  it("clears the match and takes a team that was playing it home", async () => {
    const team = teamRow("Radnóti, Budapest");
    const reset = await serve(team);

    const response = await reset("strategy");

    expect(response.status).toBe(200);
    expect(team.strategyMatchID).toBeNull();
    expect(team.pageState).toBe("HOME");
    expect(team.other).toBe(`Radnóti, Budapest prevstratid:${MATCH_ID}`);
    expect(team.save).toHaveBeenCalledOnce();
  });

  it("leaves a team on the page it is on when the other game is reset", async () => {
    const team = teamRow("", "RELAY");
    const reset = await serve(team);

    await reset("strategy");

    expect(team.pageState).toBe("RELAY");
  });

  it("answers 404 for a team the repository does not have", async () => {
    const reset = await serve(null);

    expect((await reset("relay")).status).toBe(404);
  });

  // The regression: `other` holds the organisers' notes *and* the audit trail
  // the route appends, and its validator asked for less than the column holds.
  // A team imported at the import's own limit therefore had its first reset
  // refused — and because `pageState` and the match were assigned in memory
  // only, refused every time it was tried again.
  it("resets a team whose notes were imported at the import limit", async () => {
    const team = teamRow("x".repeat(OTHER_IMPORT_MAX_LENGTH));
    const reset = await serve(team);

    const response = await reset("relay");

    expect(response.status).toBe(200);
    expect(team.relayMatchID).toBeNull();
    expect(team.other).toContain(`prevrelayid:${MATCH_ID}`);
  });

  // The trail is a convenience; the reset is not. A field with no room left
  // costs the note rather than the organiser's reset.
  it("resets a team whose notes leave no room for the trail, and keeps the notes", async () => {
    const full = "x".repeat(OTHER_MAX_LENGTH);
    const team = teamRow(full);
    const reset = await serve(team);

    const response = await reset("relay");

    expect(response.status).toBe(200);
    expect(team.relayMatchID).toBeNull();
    expect(team.other).toBe(full);
  });
});
