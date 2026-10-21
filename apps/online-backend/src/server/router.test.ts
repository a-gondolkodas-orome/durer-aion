import { expect, it, vi } from "vitest";
import { AddressInfo } from "node:net";
import { Server } from "boardgame.io/server";
import type { TeamsRepository } from "./db";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

// boardgame.io adds its lobby routes inside `run()`, after ours, so only a
// server that has run shows whether they are closed.
it("closes boardgame.io's lobby API without reporting an error", async () => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  const game = { name: "game", setup: () => ({}) };
  const server = Server({ games: [game], origins: [] });
  configureTeamsRouter(server.router, {} as TeamsRepository, [game], requireAdmin("unused-here"));
  const errors = vi.fn();
  server.app.on("error", errors);
  const running = await server.run(0);

  try {
    const { port } = running.appServer.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/games/${game.name}/create`, { method: "POST" });

    expect(response.status).toBe(404);
    expect(await server.db.listMatches({})).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    server.kill(running);
  }
});
