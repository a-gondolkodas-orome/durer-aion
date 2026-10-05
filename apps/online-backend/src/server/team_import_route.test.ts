import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { TeamsRepository } from "./db";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
const UNIT_TEST_TSV = readFileSync(join(__dirname, "..", "..", "..", "..", "scripts", "unit_test.tsv"), "utf8");

// The route over HTTP, the way team_restore.test.ts serves it: a real router on
// a loopback port, over a repository that is a stub.
describe("PUT /team/admin/import", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function upload(teams: Partial<TeamsRepository>, ...files: [filename: string, content: string][]) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 400 is under test, and koa logs every error it writes.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams as TeamsRepository, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    const body = new FormData();
    for (const [filename, content] of files) {
      body.append("file", new Blob([content]), filename);
    }
    return fetch(`http://127.0.0.1:${port}/team/admin/import`, { method: "PUT", headers: { authorization: CREDENTIALS }, body });
  }

  it("imports the uploaded TSV", async () => {
    const teams = { connect: vi.fn().mockResolvedValue(undefined), insertTeam: vi.fn().mockResolvedValue(undefined) };

    const response = await upload(teams, ["unit_test.tsv", UNIT_TEST_TSV]);

    expect(response.status).toBe(200);
    // Every row of the fixture but the empty one; the duplicates are refused
    // only by a real database.
    expect(await response.json()).toMatchObject({ successful: 8, failed: 0 });
    expect(teams.insertTeam).toHaveBeenCalledTimes(8);
  });

  it("answers 400 for a file that is not a .tsv", async () => {
    const teams = { connect: vi.fn(), insertTeam: vi.fn() };

    const response = await upload(teams, ["teams.csv", UNIT_TEST_TSV]);

    expect(response.status).toBe(400);
    expect(teams.insertTeam).not.toHaveBeenCalled();
  });

  it("answers 400 for two files", async () => {
    const teams = { connect: vi.fn(), insertTeam: vi.fn() };

    const response = await upload(teams, ["a.tsv", UNIT_TEST_TSV], ["b.tsv", UNIT_TEST_TSV]);

    expect(response.status).toBe(400);
    expect(teams.insertTeam).not.toHaveBeenCalled();
  });
});
