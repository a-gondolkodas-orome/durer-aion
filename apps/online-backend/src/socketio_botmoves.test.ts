import type { AddressInfo } from "node:net";
import type { Game, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { createMatch } from "boardgame.io/internal";
import { io as connect, type Socket } from "socket.io-client";
import { SocketIOButBotMoves } from "./socketio_botmoves";

/** The transport, with the match queues it keeps open to inspection. */
class InspectedTransport extends SocketIOButBotMoves {
  queueFor(matchID: string) {
    return this.perMatchQueue.get(matchID);
  }
}

const game: Game = {
  name: "test-game",
  setup: () => ({}),
  moves: { noop: () => undefined },
};

const KNOWN_MATCH = "known-match";
const MADE_UP_MATCH = "made-up-match";
const CHAT_MATCH = "chat-match";

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
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = new InspectedTransport({}, {});
    const server = Server({
      games: [game],
      transport,
    });
    const { appServer } = await server.run(0);
    quiet.forEach(spy => { spy.mockRestore(); });
    const db = server.app.context.db as StorageAPI.Sync;
    const { port } = appServer.address() as AddressInfo;

    const sockets: Socket[] = [];
    running.push(async () => {
      sockets.forEach(socket => socket.disconnect());
      await new Promise(resolve => appServer.close(resolve));
      failed.mockRestore();
    });

    const client = () => {
      const socket = connect(`http://127.0.0.1:${port}/${game.name}`, { transports: ["websocket"] });
      sockets.push(socket);
      return socket;
    };
    // console.error is stubbed for the whole test, so a hook failure the
    // transport catches and logs is visible only here.
    const hookFailures = () => failed.mock.calls.map(([line]) => String(line)).filter(line => line.startsWith("Reacting to"));
    /** Waits out the work a packet queued for the match, and the hook
     *  chained behind it. */
    const drained = async (matchID: string) => {
      await transport.queueFor(matchID)?.onIdle();
      await new Promise(resolve => setImmediate(resolve));
    };
    return { db, client, hookFailures, drained };
  }

  function createKnownMatch(db: StorageAPI.Sync, matchID = KNOWN_MATCH) {
    db.createMatch(matchID, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);
  }

  /** A refusal is silence; the answer to a sync sent after it is the signal
   *  that it has been dealt with. */
  function syncBehind(socket: Socket) {
    const synced = new Promise<string>(resolve => socket.on("sync", (id: string) => { resolve(id); }));
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    return synced;
  }

  /** The match ids storage is asked for from here on, other than the one
   *  `syncBehind` reads. */
  function readsOtherThanKnown(db: StorageAPI.Sync) {
    const fetch = vi.spyOn(db, "fetch");
    return () => fetch.mock.calls.map(([matchID]) => matchID as unknown).filter(matchID => matchID !== KNOWN_MATCH);
  }

  function watchForUnhandledRejections() {
    const rejections: unknown[] = [];
    const listener = (error: unknown) => { rejections.push(error); };
    process.on("unhandledRejection", listener);
    running.push(async () => { process.off("unhandledRejection", listener); });
    return rejections;
  }

  // What a legitimate client does: the match is created server-side first
  // (server/team_manage.ts), and only its id ever reaches a browser.
  it("answers a sync for a match that exists", async () => {
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = new Promise<string>(resolve => socket.on("sync", (matchID: string) => { resolve(matchID); }));
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);

    expect(await synced).toBe(KNOWN_MATCH);
  });

  // boardgame.io's Master.onSync creates a match when it does not find one,
  // and skips its credential check entirely when playerID is null.
  it("writes no match for a sync naming one that does not exist", async () => {
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("sync", MADE_UP_MATCH, null, undefined, 2);
    await syncBehind(socket);

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
      createKnownMatch(db);

      const socket = client();
      socket.emit("sync", matchID, null, undefined, 2);

      expect(await syncBehind(socket)).toBe(KNOWN_MATCH);
    }
  );

  const madeUpMove = { type: "MAKE_MOVE", payload: { type: "noop", args: [], playerID: "0", credentials: "made up" } };

  // This reaches boardgame.io, which answers it without writing: the bot hook
  // behind it is what must not fail (#695).
  it("survives an update naming a match that does not exist, and writes none", async () => {
    const rejections = watchForUnhandledRejections();
    const { db, client, hookFailures, drained } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("update", madeUpMove, 0, MADE_UP_MATCH, "0");
    await syncBehind(socket);
    await drained(MADE_UP_MATCH);

    expect(db.fetch(MADE_UP_MATCH, { metadata: true, state: true })).toEqual({});
    expect(rejections).toEqual([]);
    expect(hookFailures()).toEqual([]);
  });

  // Postgres rejects a key that is not a string, and boardgame.io's own
  // listeners leave that rejection unhandled, which ends the process (#695).
  it.each([
    ["an object", {}],
    ["a number", 5],
    ["empty", ""],
  ])("refuses an update whose match id is %s before storage is asked", async (_case, matchID) => {
    const { db, client } = await serve();
    createKnownMatch(db);
    const reads = readsOtherThanKnown(db);

    const socket = client();
    socket.emit("update", madeUpMove, 0, matchID, "0");
    await syncBehind(socket);

    expect(reads()).toEqual([]);
  });

  it.each([
    ["a match that exists", CHAT_MATCH],
    ["an object for a match id", {}],
  ])("refuses every chat, even one naming %s, before storage is asked", async (_case, matchID) => {
    const { db, client } = await serve();
    createKnownMatch(db);
    createKnownMatch(db, CHAT_MATCH);
    const reads = readsOtherThanKnown(db);

    const socket = client();
    socket.emit("chat", matchID, { id: "a", sender: "0", payload: "hi" }, "made up");
    await syncBehind(socket);

    expect(reads()).toEqual([]);
  });

  it.each([
    ["no payload", { type: "MAKE_MOVE" }],
    ["nothing", null],
  ])("survives an update for a real match whose action carries %s", async (_case, actionData) => {
    const rejections = watchForUnhandledRejections();
    const { db, client, hookFailures, drained } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("update", actionData, 0, KNOWN_MATCH, "0");
    await syncBehind(socket);
    await drained(KNOWN_MATCH);

    expect(rejections).toEqual([]);
    expect(hookFailures()).toEqual([]);
  });
});
