import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { TeamsRepository } from "./db";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const PASSWORD = "organiser-password";
const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString("base64")}`;
const TSV = "Teamname\tCategory\tEmail\tOther\nAlpha\tC\ta@b.com\tx\n";

// The route over HTTP, the way team_restore.test.ts serves it: a real router on
// a loopback port, over a repository that is a stub.
describe("PUT /team/admin/import", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function upload(teams: Partial<TeamsRepository>, filename: string) {
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
    body.append("file", new Blob([TSV]), filename);
    return fetch(`http://127.0.0.1:${port}/team/admin/import`, { method: "PUT", headers: { authorization: CREDENTIALS }, body });
  }

  it("imports the uploaded TSV", async () => {
    const teams = { connect: vi.fn(), insertTeam: vi.fn() };

    const response = await upload(teams, "teams.tsv");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ successful: 1, failed: 0 });
    expect(teams.insertTeam).toHaveBeenCalledOnce();
  });

  it("answers 400 for a file that is not a .tsv", async () => {
    const teams = { connect: vi.fn(), insertTeam: vi.fn() };

    const response = await upload(teams, "teams.csv");

    expect(response.status).toBe(400);
    expect(teams.insertTeam).not.toHaveBeenCalled();
  });
});
