import { it, expect, vi } from "vitest";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { TeamsRepository } from "./db";
import { ADMIN_USER, requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

// Over HTTP, as team_restore.test.ts serves its routes: koa-body needs a real
// multipart request.
it.each([
  ["teams.tsv", 200, 1],
  ["teams.csv", 400, 0],
])("PUT /team/admin/import of %s answers %i", async (filename, status, inserted) => {
  const teams: Partial<TeamsRepository> = { connect: vi.fn(), insertTeam: vi.fn() };
  const app = new Koa<Koa.DefaultState, Server.AppCtx>();
  // The 400 is under test, and koa logs every error it writes.
  app.silent = true;
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, teams as TeamsRepository, [], requireAdmin("pw"));
  app.use(router.routes());
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const body = new FormData();
    body.append("file", new Blob(["Teamname\tCategory\tEmail\tOther\nAlpha\tC\ta@b.com\tx\n"]), filename);
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/team/admin/import`, {
      method: "PUT",
      headers: { authorization: `Basic ${btoa(`${ADMIN_USER}:pw`)}` },
      body,
    });
    expect(response.status).toBe(status);
    expect(teams.insertTeam).toHaveBeenCalledTimes(inserted);
  } finally {
    server.close();
  }
});
