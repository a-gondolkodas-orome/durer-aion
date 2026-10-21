import { expect, it, vi } from "vitest";
import { AddressInfo } from "node:net";
import { Server } from "boardgame.io/server";
import { MyGameWrappers, gameWrapper, strategyNames } from "game";
import type { TeamsRepository } from "./db";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

// boardgame.io adds its lobby routes inside `run()`, after ours, so only a
// server that has run shows whether they are closed.
it("closes boardgame.io's lobby API", async () => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  const game = { ...gameWrapper(MyGameWrappers.E()), name: strategyNames.E };
  const server = Server({ games: [game], origins: [] });
  configureTeamsRouter(server.router, {} as TeamsRepository, [game], requireAdmin("unused-here"));
  const running = await server.run(0);
  const { port } = running.appServer.address() as AddressInfo;

  const response = await fetch(`http://127.0.0.1:${port}/games/${game.name}/create`, { method: "POST" });

  server.kill(running);
  expect(response.status).toBe(404);
  expect(await server.db.listMatches({})).toEqual([]);
});
