import { describe, it, expect, afterEach, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Game, Server as BgioServer, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { Async as AsyncStorage, createMatch } from "boardgame.io/internal";
import { io as connect, type Socket } from "socket.io-client";
import { SocketIOButBotMoves } from "./socketio_botmoves";

/** Puts the server's in-memory store behind a promise that settles when the
 *  caller says, and reports itself as an async store so the transport awaits
 *  it the way it awaits Postgres. The in-memory store answers within the same
 *  tick, which is the one case where two packets cannot reach a read before
 *  either has answered — so it cannot show whether the order is kept.
 *
 *  Only the calls this suite reaches are delegated; anything else says so
 *  rather than answering with undefined. */
function deferReads(context: BgioServer.AppCtx, settle: (matchID: string) => Promise<void>) {
  const store = context.db as StorageAPI.Sync;
  const deferred: StorageAPI.Async = {
    type: () => AsyncStorage.prototype.type(),
    connect: async () => undefined,
    createMatch: async (matchID, opts) => { store.createMatch(matchID, opts); },
    setState: async (matchID, state, deltalog) => { store.setState(matchID, state, deltalog); },
    setMetadata: async (matchID, metadata) => { store.setMetadata(matchID, metadata); },
    fetch: async (matchID, opts) => {
      await settle(matchID);
      return store.fetch(matchID, opts);
    },
    wipe: async () => { throw new Error("deferReads does not delegate wipe"); },
    listMatches: async () => { throw new Error("deferReads does not delegate listMatches"); },
  };
  context.db = deferred;
}

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
    // The stubs outlive the boot because a refused packet is reported too, and
    // the tests below assert on what was written rather than let it through.
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const quiet = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const server = Server({
      games: [game],
      transport: new SocketIOButBotMoves({}, {}),
    });
    const { appServer } = await server.run(0);
    const db = server.app.context.db as StorageAPI.Sync;
    const { port } = appServer.address() as AddressInfo;
    const context = server.app.context;

    const sockets: Socket[] = [];
    running.push(async () => {
      sockets.forEach(socket => socket.disconnect());
      await new Promise(resolve => appServer.close(resolve));
      [warned, failed, quiet].forEach(spy => { spy.mockRestore(); });
    });

    const client = () => {
      const socket = connect(`http://127.0.0.1:${port}/${game.name}`, { transports: ["websocket"] });
      sockets.push(socket);
      return socket;
    };
    return { db, client, context, warned, failed };
  }

  /** A packet the transport refuses is answered with nothing, so there is no
   *  reply to wait for. A legitimate sync behind it on the same socket is: the
   *  guard releases a socket's packets in the order they arrived, so an answer
   *  to the second means the first has been dealt with. */
  function syncedAfter(socket: Socket) {
    return new Promise<string>(resolve => socket.on("sync", (id: string) => { resolve(id); }));
  }

  /** Node ends the process over a rejection nobody is listening to, and a
   *  socket listener's promise is one nobody awaits. Registering a listener is
   *  also what keeps vitest's own handling out of the assertion. */
  function watchForUnhandledRejections() {
    const rejections: unknown[] = [];
    const listener = (error: unknown) => { rejections.push(error); };
    process.on("unhandledRejection", listener);
    running.push(async () => { process.off("unhandledRejection", listener); });
    // A rejection is reported a tick after the microtask queue drains, so a
    // caller has to let the loop turn before reading this.
    return rejections;
  }

  function createKnownMatch(db: StorageAPI.Sync) {
    db.createMatch(KNOWN_MATCH, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);
  }

  const settle = () => new Promise(resolve => setTimeout(resolve, 250));

  // What a legitimate client does: the match is created server-side first
  // (server/team_manage.ts), and only its id ever reaches a browser.
  it("answers a sync for a match that exists", async () => {
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = syncedAfter(socket);
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);

    expect(await synced).toBe(KNOWN_MATCH);
  });

  // boardgame.io's Master.onSync creates a match when it does not find one,
  // and skips its credential check entirely when playerID is null.
  it("writes no match for a sync naming one that does not exist", async () => {
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = syncedAfter(socket);
    socket.emit("sync", MADE_UP_MATCH, null, undefined, 2);
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
      createKnownMatch(db);

      const socket = client();
      const synced = syncedAfter(socket);
      socket.emit("sync", matchID, null, undefined, 2);
      socket.emit("sync", KNOWN_MATCH, null, undefined, 2);

      expect(await synced).toBe(KNOWN_MATCH);
    }
  );

  // The packet that used to end the round for everyone: nothing authenticates
  // an `update`, the bot hook read the match the id named, and `state.ctx` off
  // a match that is not there rejected in a listener nobody awaits (#437).
  it("survives an update naming a match that does not exist", async () => {
    const rejections = watchForUnhandledRejections();
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = syncedAfter(socket);
    socket.emit(
      "update",
      { type: "MAKE_MOVE", payload: { type: "aMove", args: [], playerID: "0", credentials: "made up" } },
      0,
      MADE_UP_MATCH,
      "0"
    );
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await synced;
    await settle();

    expect(rejections).toEqual([]);
  });

  // The guard says the id names a real match and nothing about the action, so
  // the shape of what follows is still the client's to choose.
  it.each([
    ["no payload", { type: "MAKE_MOVE" }],
    ["a payload that is not an object", { type: "MAKE_MOVE", payload: "a move" }],
    ["no type at all", {}],
    ["nothing", null],
  ])("survives an update for a real match whose action carries %s", async (_case, actionData) => {
    const rejections = watchForUnhandledRejections();
    const { db, client } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = syncedAfter(socket);
    socket.emit("update", actionData, 0, KNOWN_MATCH, "0");
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await synced;
    await settle();

    expect(rejections).toEqual([]);
  });

  // How many packets arrive is the client's choice, so what a refusal writes
  // has to be bounded by something that is not.
  it("reports a refusal once per socket, however many arrive", async () => {
    const { db, client, warned } = await serve();
    createKnownMatch(db);

    const socket = client();
    const synced = syncedAfter(socket);
    for (let i = 0; i < 20; i++) socket.emit("sync", `${MADE_UP_MATCH}-${i}`, null, undefined, 2);
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await synced;

    // boardgame.io writes its own CORS advice on boot through the same method.
    const refusals = warned.mock.calls.map(([line]) => String(line)).filter(line => line.startsWith("Refused"));
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain(`sync for unknown match ${MADE_UP_MATCH}-0`);
  });

  // The check reads storage, and socket.io starts the next packet through the
  // middleware without waiting for it. boardgame.io rejects a move carrying a
  // stateID that is no longer current, so a pair that swapped here would cost
  // a team the move it sent second. The reads are made to answer in the
  // reverse of the order they were asked in, which is what an unordered guard
  // would pass straight on to the listeners.
  it("releases a socket's packets in the order they arrived", async () => {
    const { db, client, context } = await serve();
    const sent = ["first", "second", "third", "fourth"];
    sent.forEach(id => {
      db.createMatch(id, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);
    });
    deferReads(context, matchID => new Promise(resolve => {
      setTimeout(resolve, 20 * (sent.length - sent.indexOf(matchID)));
    }));

    const socket = client();
    const answered: string[] = [];
    socket.on("sync", (id: string) => { answered.push(id); });
    sent.forEach(id => socket.emit("sync", id, null, undefined, 2));
    await vi.waitFor(() => { expect(answered).toHaveLength(sent.length); });

    expect(answered).toEqual(sent);
  });

  // A storage failure and a match nobody created both end in a refused packet,
  // and they call for opposite reactions — so whoever reads the log has to be
  // able to tell which one happened.
  it("says so when it was storage, not the match, that failed", async () => {
    const { db, client, context, warned } = await serve();
    createKnownMatch(db);
    deferReads(context, () => Promise.reject(new Error("the database is not there")));

    const socket = client();
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await vi.waitFor(() => {
      expect(warned.mock.calls.map(([line]) => String(line)))
        .toContainEqual(expect.stringContaining("storage could not be read"));
    });

    expect(warned.mock.calls.map(([line]) => String(line)))
      .not.toContainEqual(expect.stringContaining("unknown match"));
  });
});
