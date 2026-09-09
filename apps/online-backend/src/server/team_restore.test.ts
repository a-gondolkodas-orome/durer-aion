import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { PostgresStore } from "bgio-postgres";
import { Sequelize, Transaction, UniqueConstraintError, ValidationErrorItem } from "sequelize";
import { TeamsRepository } from "./db";
import { TeamModel } from "./model";
import { DeletedTeamModel } from "./deletedTeam";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const DELETED_AT = new Date("2026-09-07T10:00:00.123Z");

const row = {
  teamId: "8eae8669-125c-42e5-8b49-89afbac31679",
  joinCode: "000-0000-000",
  teamName: "Alpha",
  category: "C",
  credentials: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b",
  email: "team@example.com",
  pageState: "RELAY",
  relayMatch: { state: "IN PROGRESS", matchID: "relay-match", startAt: "2026-09-07T09:00:00.000Z", endAt: "2026-09-07T10:00:00.000Z" },
  strategyMatch: { state: "NOT STARTED" },
  other: "",
};

// What postgres answers when a live team holds one of the unique columns: the
// message is the one the column's `unique.msg` in model.ts supplies. Only the
// message is read, so the item is built as data rather than through the
// eight-argument constructor.
const taken = () => new UniqueConstraintError({
  errors: [{ message: "Teamname already exists.", type: "unique violation", path: "teamName" } as ValidationErrorItem],
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The routes over HTTP, the way admin_session.test.ts serves them: a real router
// on a loopback port, over a repository that is a stub.
describe("the restore routes", () => {
  const PASSWORD = "organiser-password";
  const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: Partial<TeamsRepository>) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 4xx answers are under test, and koa logs every error it writes.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams as TeamsRepository, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (method: string, path: string, body?: unknown) => fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { authorization: CREDENTIALS, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("serves the archive", async () => {
    const request = await serve({ listDeletedTeams: vi.fn().mockResolvedValue([{ ...row, deletedAt: DELETED_AT, deletionId: 7 }]) });

    const response = await request("GET", "/team/admin/deleted");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual([{ ...row, deletedAt: DELETED_AT.toISOString(), deletionId: 7 }]);
  });

  // One request for all of them, so the batch is one timestamp.
  it("deletes every team in one request and names the batch", async () => {
    const teams = { removeAllTeams: vi.fn().mockResolvedValue({ deleted: 3, deletedAt: DELETED_AT }) };
    const request = await serve(teams);

    const response = await request("DELETE", "/team/admin/all");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ deleted: 3, deletedAt: DELETED_AT.toISOString() });
    expect(teams.removeAllTeams).toHaveBeenCalledOnce();
  });

  it("restores the archive row named in the path", async () => {
    const teams = { restoreTeam: vi.fn().mockResolvedValue(row) };
    const request = await serve(teams);

    const response = await request("POST", "/team/admin/deleted/7/restore");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(row);
    expect(teams.restoreTeam).toHaveBeenCalledWith(7);
  });

  it("answers 404 for an archive row the repository did not have", async () => {
    const request = await serve({ restoreTeam: vi.fn().mockResolvedValue(null) });

    expect((await request("POST", "/team/admin/deleted/7/restore")).status).toBe(404);
  });

  it("answers 400 for a deletionId that is not a number", async () => {
    const teams = { restoreTeam: vi.fn() };
    const request = await serve(teams);

    expect((await request("POST", "/team/admin/deleted/seven/restore")).status).toBe(400);
    expect(teams.restoreTeam).not.toHaveBeenCalled();
  });

  // The message names the column, so the organiser knows what to rename or
  // delete first.
  it("answers 409 with the column a live team holds", async () => {
    const request = await serve({ restoreTeam: vi.fn().mockRejectedValue(taken()) });

    const response = await request("POST", "/team/admin/deleted/7/restore");

    expect(response.status).toBe(409);
    expect(await response.text()).toBe("Teamname already exists.");
  });

  it("restores a batch by its timestamp", async () => {
    const teams = { restoreBatch: vi.fn().mockResolvedValue({ restored: ["Alpha"], conflicts: ["Bravo"] }) };
    const request = await serve(teams);

    const response = await request("POST", "/team/admin/deleted/restore", { deletedAt: DELETED_AT.toISOString() });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ restored: ["Alpha"], conflicts: ["Bravo"] });
    expect(teams.restoreBatch).toHaveBeenCalledWith(DELETED_AT);
  });

  it.each([
    ["no body", undefined],
    ["a body naming no batch", {}],
    ["a date that is not one", { deletedAt: "yesterday" }],
  ])("refuses a batch restore with %s", async (_, body) => {
    const teams = { restoreBatch: vi.fn() };
    const request = await serve(teams);

    expect((await request("POST", "/team/admin/deleted/restore", body)).status).toBe(400);
    expect(teams.restoreBatch).not.toHaveBeenCalled();
  });
});

// The repository over a postgres Sequelize that is never connected: the model
// calls are stubbed and the transaction is a sentinel handed to a callback, so
// what is pinned is which statements run, in what order, with what, and on
// which transaction — as team_remove.test.ts does for the deletion.
describe("TeamsRepository", () => {
  const sequelize = new Sequelize("db", "user", "password", { dialect: "postgres", logging: false });
  const transaction = { id: "the transaction" } as unknown as Transaction;

  function repository() {
    vi.spyOn(sequelize, "transaction").mockImplementation(
      (async (callback: (t: Transaction) => Promise<unknown>) => callback(transaction)) as typeof sequelize.transaction
    );
    return new TeamsRepository({ sequelize } as unknown as PostgresStore);
  }

  const model = (values: object) => ({ ...values, toJSON: () => values });

  describe("removeAllTeams", () => {
    it("archives every team under one timestamp before dropping them, on the one transaction", async () => {
      const bravo = { ...row, teamId: "1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b", teamName: "Bravo" };
      const findAll = vi.spyOn(TeamModel, "findAll").mockResolvedValue([model(row), model(bravo)] as unknown as TeamModel[]);
      const bulkCreate = vi.spyOn(DeletedTeamModel, "bulkCreate").mockResolvedValue([]);
      const destroy = vi.spyOn(TeamModel, "destroy").mockResolvedValue(2);

      const result = await repository().removeAllTeams();

      expect(findAll).toHaveBeenCalledWith({ transaction, lock: Transaction.LOCK.UPDATE });
      const [archived, options] = bulkCreate.mock.calls[0];
      expect(archived).toStrictEqual([{ ...row, deletedAt: result.deletedAt }, { ...bravo, deletedAt: result.deletedAt }]);
      expect(options).toStrictEqual({ transaction });
      expect(destroy).toHaveBeenCalledWith({ where: { teamId: [row.teamId, bravo.teamId] }, transaction });
      expect(bulkCreate.mock.invocationCallOrder[0]).toBeLessThan(destroy.mock.invocationCallOrder[0]);
      expect(result.deleted).toBe(2);
    });
  });

  describe("restoreTeam", () => {
    it("puts the team's own columns back, then drops the archive row, on the one transaction", async () => {
      const archived = model({ ...row, deletedAt: DELETED_AT, deletionId: 7 });
      const findOne = vi.spyOn(DeletedTeamModel, "findOne").mockResolvedValue(archived as unknown as DeletedTeamModel);
      const create = vi.spyOn(TeamModel, "create").mockResolvedValue(model(row));
      const destroy = vi.spyOn(DeletedTeamModel, "destroy").mockResolvedValue(1);

      const restored = await repository().restoreTeam(7);

      expect(findOne).toHaveBeenCalledWith({ where: { deletionId: 7 }, transaction, lock: Transaction.LOCK.UPDATE });
      // Page state and both matches included; the archive's two columns not.
      expect(create).toHaveBeenCalledWith(row, { transaction });
      expect(destroy).toHaveBeenCalledWith({ where: { deletionId: 7 }, transaction });
      expect(create.mock.invocationCallOrder[0]).toBeLessThan(destroy.mock.invocationCallOrder[0]);
      expect(restored).toMatchObject({ teamName: "Alpha" });
    });

    it("answers null for a row the archive does not have, touching nothing", async () => {
      vi.spyOn(DeletedTeamModel, "findOne").mockResolvedValue(null);
      const create = vi.spyOn(TeamModel, "create");
      const destroy = vi.spyOn(DeletedTeamModel, "destroy");

      expect(await repository().restoreTeam(7)).toBeNull();

      expect(create).not.toHaveBeenCalled();
      expect(destroy).not.toHaveBeenCalled();
    });

    // The constraint is the conflict check, so its error is the answer, and
    // the archive row must survive it — nothing is destroyed after a failed
    // insert.
    it("lets a live team's unique constraint stop the restore before the archive row is dropped", async () => {
      vi.spyOn(DeletedTeamModel, "findOne").mockResolvedValue(model({ ...row, deletedAt: DELETED_AT, deletionId: 7 }) as unknown as DeletedTeamModel);
      vi.spyOn(TeamModel, "create").mockRejectedValue(taken());
      const destroy = vi.spyOn(DeletedTeamModel, "destroy");

      await expect(repository().restoreTeam(7)).rejects.toBeInstanceOf(UniqueConstraintError);

      expect(destroy).not.toHaveBeenCalled();
    });
  });

  describe("restoreBatch", () => {
    it("restores the batch's rows one by one and reports the ones a live team blocked", async () => {
      const findAll = vi.spyOn(DeletedTeamModel, "findAll").mockResolvedValue([
        { deletionId: 1, teamName: "Alpha" },
        { deletionId: 2, teamName: "Bravo" },
        { deletionId: 3, teamName: "Charlie" },
      ] as unknown as DeletedTeamModel[]);
      const teams = repository();
      const restoreTeam = vi.spyOn(teams, "restoreTeam")
        .mockResolvedValueOnce(model(row) as unknown as TeamModel)
        .mockRejectedValueOnce(taken())
        // Restored by someone else meanwhile: in neither list.
        .mockResolvedValueOnce(null);

      const result = await teams.restoreBatch(DELETED_AT);

      expect(findAll).toHaveBeenCalledWith({ where: { deletedAt: DELETED_AT }, order: [["deletionId", "ASC"]] });
      expect(restoreTeam.mock.calls).toStrictEqual([[1], [2], [3]]);
      expect(result).toStrictEqual({ restored: ["Alpha"], conflicts: ["Bravo"] });
    });

    it("lets any other failure through", async () => {
      vi.spyOn(DeletedTeamModel, "findAll").mockResolvedValue([{ deletionId: 1, teamName: "Alpha" }] as unknown as DeletedTeamModel[]);
      const teams = repository();
      vi.spyOn(teams, "restoreTeam").mockRejectedValue(new Error("connection lost"));

      await expect(teams.restoreBatch(DELETED_AT)).rejects.toThrow("connection lost");
    });
  });
});
