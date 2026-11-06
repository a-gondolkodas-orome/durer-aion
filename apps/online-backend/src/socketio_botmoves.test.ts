import { describe, it, expect, afterEach, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Game, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { createMatch } from "boardgame.io/internal";
import { io as connect, type Socket } from "socket.io-client";
import { SocketIOButBotMoves } from "./socketio_botmoves";

const game: Game = {
  name: "test-game",
  setup: () => ({}),
  moves: { noop: () => undefined },
};

const KNOWN_MATCH = "known-match";
const MADE_UP_MATCH = "made-up-match";

describe("the socket transport", () => {
  const running: (() => Promise<void>)[] = [];

  afterEach(async () => {
    await Promise.all(running.splice(0).map(stop => stop()));
  });

  async function serve() {
    // boardgame.io greets the console on boot — its CORS advice and the port it
    // picked — and a test run's report is meant to have the console to itself.
    const quiet = (["log", "warn"] as const).map(
      method => vi.spyOn(console, method).mockImplementation(() => undefined)
    );
    const server = Server({
      games: [game],
      transport: new SocketIOButBotMoves({}, {}),
    });
    const { appServer } = await server.run(0);
    quiet.forEach(spy => { spy.mockRestore(); });
    const db = server.app.context.db as StorageAPI.Sync;
    const { port } = appServer.address() as AddressInfo;

    const sockets: Socket[] = [];
    running.push(async () => {
      sockets.forEach(socket => socket.disconnect());
      await new Promise(resolve => appServer.close(resolve));
    });

    const client = () => {
      const socket = connect(`http://127.0.0.1:${port}/${game.name}`, { transports: ["websocket"] });
      sockets.push(socket);
      return socket;
    };
    return { db, client };
  }

  // What a legitimate client does: the match is created server-side first
  // (server/team_manage.ts), and only its id ever reaches a browser.
  it("answers a sync for a match that exists", async () => {
    const { db, client } = await serve();
    db.createMatch(KNOWN_MATCH, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);

    const socket = client();
    const synced = new Promise<string>(resolve => socket.on("sync", (matchID: string) => { resolve(matchID); }));
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);

    expect(await synced).toBe(KNOWN_MATCH);
  });

  // boardgame.io's Master.onSync creates a match when it does not find one,
  // and skips its credential check entirely when playerID is null.
  it("writes no match for a sync naming one that does not exist", async () => {
    const { db, client } = await serve();
    db.createMatch(KNOWN_MATCH, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);

    const socket = client();
    const synced = new Promise<string>(resolve => socket.on("sync", (matchID: string) => { resolve(matchID); }));
    socket.emit("sync", MADE_UP_MATCH, null, undefined, 2);
    // Ordered behind the refused one on the same socket, so the answer to this
    // is the signal that the other has been dealt with.
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await synced;

    expect(db.fetch(MADE_UP_MATCH, { metadata: true }).metadata).toBeUndefined();
  });

  // The id is whatever the client sent, so it is not necessarily an id at all;
  // storage should not be asked to look one of these up.
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["an object that prints as a real id", { toString: (): string => KNOWN_MATCH }],
  ])(
    "refuses a sync whose match id is %s, and keeps serving the socket",
    async (_case, matchID) => {
      const { db, client } = await serve();
      db.createMatch(KNOWN_MATCH, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);

      const socket = client();
      const synced = new Promise<string>(resolve => socket.on("sync", (id: string) => { resolve(id); }));
      socket.emit("sync", matchID, null, undefined, 2);
      socket.emit("sync", KNOWN_MATCH, null, undefined, 2);

      expect(await synced).toBe(KNOWN_MATCH);
    }
  );
});
