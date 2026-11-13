import type { AddressInfo } from "node:net";
import type { Game, Server as BgioServer, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { Async as AsyncStorage, createMatch } from "boardgame.io/internal";
import type { Server as IOServer } from "socket.io";
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
    // picked — and a refused packet is reported too. The tests below assert on
    // what was written rather than let it through to the report.
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const quiet = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const transport = new SocketIOButBotMoves({}, {});
    const server = Server({
      games: [game],
      transport,
    });
    const { appServer } = await server.run(0);
    const context = server.app.context;
    // The syncs that reach the namespace's listeners, boardgame.io's among
    // them, in the order they do. A listener rather than `onAny`, which
    // socket.io runs before the middleware has seen the packet.
    const delivered: unknown[] = [];
    (server.app as typeof server.app & { _io: IOServer })._io.of(`/${game.name ?? ""}`).on("connection", (socket) => {
      socket.on("sync", (matchID: unknown) => { delivered.push(matchID); });
    });
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
    return { db, client, context, transport, delivered, refusals, failed };
  }

  function createKnownMatch(db: StorageAPI.Sync, matchID = KNOWN_MATCH) {
    db.createMatch(matchID, createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined }) as never);
  }

  /** A packet the transport refuses is answered with nothing, so there is no
   *  reply to wait for. A legitimate sync behind it on the same socket is: the
   *  guard releases a socket's packets in the order they arrived, so an answer
   *  to the sync means everything sent before it has been dealt with. */
  function syncBehind(socket: Socket) {
    const synced = new Promise<string>(resolve => socket.on("sync", (id: string) => { resolve(id); }));
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    return synced;
  }

  /** Node ends the process over a rejection nobody is listening to, and a
   *  socket listener's promise is one nobody awaits. Registering a listener is
   *  also what keeps vitest's own handling out of the assertion. */
  function watchForUnhandledRejections() {
    const rejections: unknown[] = [];
    const listener = (error: unknown) => { rejections.push(error); };
    process.on("unhandledRejection", listener);
    running.push(async () => { process.off("unhandledRejection", listener); });
    return rejections;
  }

  /** A rejection is reported a tick after the microtask queue drains, and the
   *  bot hook's work runs on the match queue after boardgame.io's own. */
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

  // `update` and `chat` carry a client-chosen id as `sync` does, and the bot
  // hook reads the match an update names: `state.ctx` off one that is not there
  // rejected in a listener nobody awaits, and took the process with it.
  it.each([
    ["sync", [MADE_UP_MATCH, null, undefined, 2]],
    ["update", [madeUpMove, 0, MADE_UP_MATCH, "0"]],
    ["chat", [MADE_UP_MATCH, { id: "a", sender: "0", payload: "hi" }, "made up"]],
  ])("refuses a `%s` naming a match that does not exist", async (event, args) => {
    const rejections = watchForUnhandledRejections();
    const { db, client, transport, refusals } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit(event, ...args);
    await syncBehind(socket);
    await settle();

    expect(refusals()).toEqual([expect.stringContaining(`${event} for unknown match ${MADE_UP_MATCH}`)]);
    // boardgame.io's `update` listener keys a queue off the id it is given,
    // and nothing evicts one a socket never synced to.
    expect((transport as unknown as { perMatchQueue: Map<string, unknown> }).perMatchQueue.has(MADE_UP_MATCH))
      .toBe(false);
    expect(rejections).toEqual([]);
  });

  // The guard says the id names a real match and nothing about the action, so
  // the shape of what follows is still the client's to choose.
  it.each([
    ["no payload", { type: "MAKE_MOVE" }],
    ["a payload that is not an object", { type: "MAKE_MOVE", payload: "a move" }],
    ["a payload with no type", { type: "MAKE_MOVE", payload: {} }],
    ["no type at all", {}],
    ["nothing", null],
  ])("survives an update for a real match whose action carries %s", async (_case, actionData) => {
    const rejections = watchForUnhandledRejections();
    const { db, client, failed } = await serve();
    createKnownMatch(db);

    const socket = client();
    socket.emit("update", actionData, 0, KNOWN_MATCH, "0");
    await syncBehind(socket);
    await settle();

    expect(rejections).toEqual([]);
    // boardgame.io logs its own refusal of some of these; the bot hook should
    // not have had to catch anything.
    expect(failed).not.toHaveBeenCalledWith(expect.stringContaining("Reacting to"), expect.anything());
  });

  // How many packets arrive is the client's choice, so what a refusal writes
  // has to be bounded by something that is not.
  it("reports a refusal once per socket, however many arrive", async () => {
    const { db, client, refusals } = await serve();
    createKnownMatch(db);

    const socket = client();
    for (let i = 0; i < 20; i++) socket.emit("sync", `${MADE_UP_MATCH}-${i}`, null, undefined, 2);
    await syncBehind(socket);

    expect(refusals()).toEqual([expect.stringContaining(`sync for unknown match ${MADE_UP_MATCH}-0`)]);
  });

  // The check reads storage, and socket.io starts the next packet through the
  // middleware without waiting for it. boardgame.io rejects a move carrying a
  // stateID that is no longer current, so a pair that swapped here would cost
  // a team the move it sent second. The reads are made to answer in the
  // reverse of the order they were asked in, which is what an unordered guard
  // would pass straight on to the listeners.
  it("releases a socket's packets in the order they arrived", async () => {
    const { db, client, context, delivered } = await serve();
    const sent = ["first", "second", "third", "fourth"];
    sent.forEach(id => { createKnownMatch(db, id); });
    deferReads(context, matchID => new Promise(resolve => {
      setTimeout(resolve, 20 * (sent.length - sent.indexOf(matchID)));
    }));

    const socket = client();
    sent.forEach(id => socket.emit("sync", id, null, undefined, 2));
    await vi.waitFor(() => { expect(delivered).toHaveLength(sent.length); });

    expect(delivered).toEqual(sent);
  });

  // A storage failure and a match nobody created both end in a refused packet,
  // and they call for opposite reactions — so whoever reads the log has to be
  // able to tell which one happened.
  it("says so when it was storage, not the match, that failed", async () => {
    const { db, client, context, refusals } = await serve();
    createKnownMatch(db);
    deferReads(context, () => Promise.reject(new Error("the database is not there")));

    const socket = client();
    socket.emit("sync", KNOWN_MATCH, null, undefined, 2);
    await vi.waitFor(() => { expect(refusals()).toHaveLength(1); });

    expect(refusals()[0]).toContain("storage could not be read");
    expect(refusals()[0]).not.toContain("unknown match");
  });
});
