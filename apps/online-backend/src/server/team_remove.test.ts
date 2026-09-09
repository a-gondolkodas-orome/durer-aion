import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { PostgresStore } from "bgio-postgres";
import { Sequelize, Transaction } from "sequelize";
import { TeamsRepository } from "./db";
import { TeamModel } from "./model";
import { DeletedTeamModel } from "./deletedTeam";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";

afterEach(() => {
  vi.restoreAllMocks();
});

// The route over HTTP, the way admin_session.test.ts serves it: a real router
// on a loopback port, over a repository that is a stub.
describe("DELETE /team/admin/:teamID/remove", () => {
  const PASSWORD = "organiser-password";
  const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 404 is one of the answers under test, and koa logs every error it writes.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (teamId: string) => fetch(
      `http://127.0.0.1:${port}/team/admin/${teamId}/remove`,
      { method: "DELETE", headers: { authorization: CREDENTIALS } },
    );
  }

  const teamsRemoving = (dropped: number) =>
    ({ removeTeam: vi.fn().mockResolvedValue(dropped) }) as unknown as TeamsRepository;

  it("removes the team named in the path", async () => {
    const teams = teamsRemoving(1);
    const remove = await serve(teams);

    const response = await remove(TEAM_ID);

    expect(response.status).toBe(200);
    expect(teams.removeTeam).toHaveBeenCalledWith(TEAM_ID);
  });

  // The admin page shows this as "the team no longer exists": its list was
  // stale, and the message is what tells the admin so.
  it("answers 404 for a team the repository did not have", async () => {
    const remove = await serve(teamsRemoving(0));

    const response = await remove(TEAM_ID);

    expect(response.status).toBe(404);
  });
});

// The repository, over a postgres Sequelize that is never connected: the model
// calls are stubbed, and the transaction is a sentinel handed to a callback,
// so what is pinned is which statements run, in what order, and on which
// transaction — db.test.ts does the same for the SQL of `fetch`.
describe("TeamsRepository.removeTeam", () => {
  const sequelize = new Sequelize("db", "user", "password", { dialect: "postgres", logging: false });
  const transaction = { id: "the transaction" } as unknown as Transaction;

  const row = {
    teamId: TEAM_ID,
    joinCode: "000-0000-000",
    teamName: "Alpha",
    category: "C",
    credentials: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b",
    email: "team@example.com",
    pageState: "HOME",
    relayMatch: { state: "NOT STARTED" },
    strategyMatch: { state: "NOT STARTED" },
    other: "",
  };

  function repository(found: typeof row | null) {
    vi.spyOn(sequelize, "transaction").mockImplementation(
      (async (callback: (t: Transaction) => Promise<unknown>) => callback(transaction)) as typeof sequelize.transaction
    );
    const findOne = vi.spyOn(TeamModel, "findOne")
      .mockResolvedValue(found && { toJSON: () => found } as unknown as TeamModel);
    const create = vi.spyOn(DeletedTeamModel, "create").mockResolvedValue({});
    const destroy = vi.spyOn(TeamModel, "destroy").mockResolvedValue(1);
    const teams = new TeamsRepository({ sequelize } as unknown as PostgresStore);
    return { teams, findOne, create, destroy };
  }

  it("archives the team before dropping it, both on the one transaction", async () => {
    const { teams, findOne, create, destroy } = repository(row);

    expect(await teams.removeTeam(TEAM_ID)).toBe(1);

    expect(findOne).toHaveBeenCalledWith({ where: { teamId: TEAM_ID }, transaction, lock: Transaction.LOCK.UPDATE });
    expect(create).toHaveBeenCalledWith({ ...row, deletedAt: expect.any(Date) }, { transaction });
    expect(destroy).toHaveBeenCalledWith({ where: { teamId: TEAM_ID }, transaction });
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(destroy.mock.invocationCallOrder[0]);
  });

  it("archives nothing for a team it does not have", async () => {
    const { teams, create, destroy } = repository(null);

    expect(await teams.removeTeam(TEAM_ID)).toBe(0);

    expect(create).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });
});
