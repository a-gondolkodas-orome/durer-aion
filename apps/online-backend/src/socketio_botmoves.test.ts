import type { AddressInfo } from "node:net";
import type { Game, Server as BgioServer, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { Async as AsyncStorage, createMatch } from "boardgame.io/internal";
import { io as connect, type Socket } from "socket.io-client";
import { SocketIOButBotMoves } from "./socketio_botmoves";

/** The in-memory store as an async one whose reads wait on `settle`, as
 *  Postgres's would. */
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
    wipe: async () => { throw new Error("not delegated"); },
    listMatches: async () => { throw new Error("not delegated"); },
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
    // boardgame.io greets the console on boot, and a refusal is logged.
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const quiet = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const server = Server({
      games: [game],
      transport: new SocketIOButBotMoves({}, {}),
    });
    const { appServer } = await server.run(0);
    const context = server.app.context;
    const db = context.db as StorageAPI.Sync;
    const { port } = appServer.address() as AddressInfo;

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
    const refusals = () => warned.mock.calls.map(([line]) => String(line)).filter(line => line.startsWith("Refused"));
    // console.error is stubbed for the whole test, so a hook failure the
    // transport catches and logs is visible only here.
    const hookFailures = () => failed.mock.calls.map(([line]) => String(line)).filter(line => line.startsWith("Reacting to"));
    return { db, client, context, failed, refusals, hookFailures };
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

  function watchForUnhandledRejections() {
    const rejections: unknown[] = [];
    const listener = (error: unknown) => { rejections.push(error); };
    process.on("unhandledRejection", listener);
    running.push(async () => { process.off("unhandledRejection", listener); });
    return rejections;
  }

  // Lets the bot hook, queued behind boardgame.io's own work, finish.
  const settle = () => new Promise(resolve => setTimeout(resolve, 250));

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

  it("refuses a sync naming a match that does not exist, and says so", async () => {
    const { db, client, refusals } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("sync", MADE_UP_MATCH, null, undefined, 2);
    await syncBehind(socket);

    expect(refusals()).toEqual([expect.stringContaining(`sync for unknown match ${MADE_UP_MATCH}`)]);
  });

  // These reach boardgame.io, which answers them without writing: the bot
  // hook behind them is what must not fail (#695).
  it.each([
    ["update", [madeUpMove, 0, MADE_UP_MATCH, "0"]],
    ["chat", [MADE_UP_MATCH, { id: "a", sender: "0", payload: "hi" }, "made up"]],
  ])("survives a `%s` naming a match that does not exist, and writes none", async (event, args) => {
    const rejections = watchForUnhandledRejections();
    const { db, client, hookFailures } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit(event, ...args);
    await syncBehind(socket);
    await settle();

    expect(db.fetch(MADE_UP_MATCH, { metadata: true, state: true })).toEqual({});
    expect(rejections).toEqual([]);
    expect(hookFailures()).toEqual([]);
  });

  it.each([
    ["no payload", { type: "MAKE_MOVE" }],
    ["a payload that is not an object", { type: "MAKE_MOVE", payload: "a move" }],
    ["a payload with no type", { type: "MAKE_MOVE", payload: {} }],
    ["no type at all", {}],
    ["nothing", null],
  ])("survives an update for a real match whose action carries %s", async (_case, actionData) => {
    const rejections = watchForUnhandledRejections();
    const { db, client, hookFailures } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("update", actionData, 0, KNOWN_MATCH, "0");
    await syncBehind(socket);
    await settle();

    expect(rejections).toEqual([]);
    expect(hookFailures()).toEqual([]);
  });

  it("reports a refusal once per socket, however many arrive", async () => {
    const { db, client, refusals } = await serve();
    createKnownMatch(db);

    const socket = client();
    for (let i = 0; i < 20; i++) socket.emit("sync", `${MADE_UP_MATCH}-${i}`, null, undefined, 2);
    await syncBehind(socket);

    expect(refusals()).toEqual([expect.stringContaining(`sync for unknown match ${MADE_UP_MATCH}-0`)]);
  });

  it("says so when it was storage, not the match, that failed", async () => {
    const { db, client, context, failed, refusals } = await serve();
    createKnownMatch(db);
    deferReads(context, () => Promise.reject(new Error("the database is not there")));

    const socket = client();
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await vi.waitFor(() => {
      expect(failed).toHaveBeenCalledWith(expect.stringContaining("Storage could not be read"), expect.anything());
    });

    expect(refusals()).toEqual([]);
  });
});
