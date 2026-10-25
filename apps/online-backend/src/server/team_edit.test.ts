import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { UniqueConstraintError } from "sequelize";
import type { TeamsRepository } from "./db";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;

// The route over HTTP, as admin_session.test.ts serves it, over a repository
// that is a stub: what the repository decides is db.postgres.test.ts's.
const servers: http.Server[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function serve(editTeam: TeamsRepository["editTeam"]) {
  const teams = { editTeam: vi.fn(editTeam) };
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // The 4xx answers are under test, and koa logs every error it writes.
  app.silent = true;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, teams as unknown as TeamsRepository, [], requireAdmin(PASSWORD));
  app.use(router.routes());
  const handle = app.callback();
  const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise(resolve => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  const patch = (body: unknown) => fetch(`http://127.0.0.1:${port}/team/admin/${TEAM_ID}`, {
    method: "PATCH",
    headers: { authorization: CREDENTIALS, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { teams, patch };
}

describe("PATCH /team/admin/:teamID", () => {
  it("hands the repository the trimmed name and the category", async () => {
    const { teams, patch } = await serve(async () => ({ toJSON: () => ({ teamName: "Alpha" }), relayMatchID: null, strategyMatchID: null }) as never);

    const response = await patch({ teamName: "  Alpha ", category: "D" });

    expect(response.status).toBe(200);
    expect(teams.editTeam).toHaveBeenCalledWith(TEAM_ID, { teamName: "Alpha", category: "D" });
  });

  it.each([
    ["an empty name", { teamName: "   " }],
    ["a name too long", { teamName: "x".repeat(256) }],
    ["a name that is not a string", { teamName: 7 }],
    ["a category outside the competition's", { category: "C+" }],
  ])("answers 400 for %s, without asking the repository", async (_, body) => {
    const { teams, patch } = await serve(async () => "not-found");

    expect((await patch(body)).status).toBe(400);
    expect(teams.editTeam).not.toHaveBeenCalled();
  });

  it("answers 404 for a team the repository does not have", async () => {
    const { patch } = await serve(async () => "not-found");

    expect((await patch({ category: "D" })).status).toBe(404);
  });

  it.each(["started", "notes-full"] as const)("answers 409 with the reason when the repository refuses: %s", async (reason) => {
    const { patch } = await serve(async () => reason);

    const response = await patch({ category: "D" });

    expect(response.status).toBe(409);
    expect(await response.json()).toStrictEqual({ reason });
  });

  it("answers 409 name-taken when another team has the name", async () => {
    const { patch } = await serve(async () => { throw new UniqueConstraintError({}); });

    const response = await patch({ teamName: "Bravo" });

    expect(response.status).toBe(409);
    expect(await response.json()).toStrictEqual({ reason: "name-taken" });
  });
});
