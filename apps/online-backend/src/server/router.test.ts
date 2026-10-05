/*
 * boardgame.io adds its lobby routes to the router this app configures, inside
 * `server.run()` — after `configureTeamsRouter` — so what closes them only
 * shows on a server that has run. This starts the real one, in memory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressInfo } from "node:net";
import { Server } from "boardgame.io/server";
import { MyGameWrappers, gameWrapper, strategyNames } from "game";
import type { TeamsRepository } from "./db";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

const GAME_NAME = strategyNames.E;
const game = { ...gameWrapper(MyGameWrappers.E()), name: GAME_NAME };

type BgioServer = ReturnType<typeof Server>;
type RunningServers = Awaited<ReturnType<BgioServer["run"]>>;

describe("boardgame.io's lobby API", () => {
  const running: { server: BgioServer; servers: RunningServers }[] = [];

  // boardgame.io announces the port it serves on; that is not this test's to report.
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const { server, servers } of running.splice(0)) server.kill(servers);
  });

  async function serve({ withTeamsRouter }: { withTeamsRouter: boolean }) {
    const server = Server({ games: [game], origins: [] });
    if (withTeamsRouter) {
      configureTeamsRouter(server.router, {} as TeamsRepository, [game], requireAdmin("unused-here"));
    }
    const servers = await server.run(0);
    running.push({ server, servers });
    const { port } = servers.appServer.address() as AddressInfo;
    const request = (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init);
    return { server, request };
  }

  const post = (body: object): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // The control: without it, a 404 below could as well mean the lobby was
  // never there.
  it("creates a match for anyone when nothing closes it", async () => {
    const { request } = await serve({ withTeamsRouter: false });

    const response = await request(`/games/${GAME_NAME}/create`, post({ numPlayers: 2 }));

    expect(response.status).toBe(200);
  });

  it("answers 404 on every route of it, and creates nothing", async () => {
    const { server, request } = await serve({ withTeamsRouter: true });

    const answers = await Promise.all([
      request("/games"),
      request(`/games/${GAME_NAME}`),
      request(`/games/${GAME_NAME}/some-match`),
      request(`/games/${GAME_NAME}/create`, post({ numPlayers: 2 })),
      request(`/games/${GAME_NAME}/some-match/join`, post({ playerName: "anyone" })),
      request(`/games/${GAME_NAME}/some-match/leave`, post({ playerID: "0" })),
      request(`/games/${GAME_NAME}/some-match/update`, post({ playerID: "0", newName: "x" })),
      request(`/games/${GAME_NAME}/some-match/rename`, post({ playerID: "0", newName: "x" })),
      request(`/games/${GAME_NAME}/some-match/playAgain`, post({ playerID: "0" })),
    ]);

    expect(answers.map(response => response.status)).toEqual(answers.map(() => 404));
    expect(await server.db.listMatches({})).toEqual([]);
  });
});
