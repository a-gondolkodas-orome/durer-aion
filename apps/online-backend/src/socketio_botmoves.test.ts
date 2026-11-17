import type { AddressInfo } from "node:net";
import type { Game, StorageAPI } from "boardgame.io";
import { Server } from "boardgame.io/server";
import { createMatch } from "boardgame.io/internal";
import { io as connect, type Socket } from "socket.io-client";
import { SocketIOButBotMoves } from "./socketio_botmoves";
import type { GuardLimits } from "./server/socket_guard";

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
const OTHER_TEAM_MATCH = "other-team-match";
/** The team's credentials, which server/router.ts puts on player 0 of every
 *  match it creates. */
const TEAM_SECRET = "team-secret";
const OTHER_TEAM_SECRET = "other-team-secret";

describe("the socket transport", () => {
  const running: (() => Promise<void>)[] = [];

  afterEach(async () => {
    await Promise.all(running.splice(0).map(stop => stop()));
  });

  async function serve(limits: GuardLimits = {}) {
    // boardgame.io greets the console on boot — its CORS advice and the port it
    // picked — and a test run's report is meant to have the console to itself.
    const quiet = (["log", "warn"] as const).map(
      method => vi.spyOn(console, method).mockImplementation(() => undefined)
    );
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = new InspectedTransport({}, {}, limits);
    const server = Server({
      games: [game],
      transport,
    });
    // As server.ts sets it: the address a failure is charged to is nginx's
    // X-Forwarded-For.
    server.app.proxy = true;
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

    const client = (address = "192.0.2.1") => {
      const socket = connect(`http://127.0.0.1:${port}/${game.name}`, {
        transports: ["websocket"],
        extraHeaders: { "X-Forwarded-For": address },
      });
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
    return { db, client, hookFailures, drained, transport };
  }

  function createKnownMatch(db: StorageAPI.Sync, matchID = KNOWN_MATCH, credentials = TEAM_SECRET) {
    const match = createMatch({ game, numPlayers: 2, unlisted: true, setupData: undefined });
    if ("setupDataError" in match) throw new Error(match.setupDataError);
    match.metadata.players[0].credentials = credentials;
    db.createMatch(matchID, match);
  }

  /** A refusal is silence; the answer to a sync sent after it is the signal
   *  that it has been dealt with. */
  function syncBehind(socket: Socket, matchID = KNOWN_MATCH, credentials = TEAM_SECRET) {
    const synced = new Promise<string>(resolve => socket.on("sync", (id: string) => { resolve(id); }));
    socket.emit("sync", matchID, "0", credentials, 2);
    return synced;
  }

  const disconnectedBy = (socket: Socket) => new Promise<string>(resolve => socket.on("disconnect", resolve));

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

    expect(await syncBehind(client())).toBe(KNOWN_MATCH);
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

  // Only a match's own player gets a packet through to boardgame.io (#720).
  describe("credentials", () => {
    const move = (credentials: string) =>
      ({ type: "MAKE_MOVE", payload: { type: "noop", args: [], playerID: "0", credentials } });

    // boardgame.io queues every sync it is handed, credentials or not, and
    // answers a spectator's (null player) with the match.
    it.each([
      ["another's credentials", "0", "made up"],
      ["no player", null, undefined],
    ])("keeps a sync with %s away from boardgame.io", async (_case, playerID, credentials) => {
      const { db, client, transport } = await serve();
      createKnownMatch(db);
      createKnownMatch(db, OTHER_TEAM_MATCH, OTHER_TEAM_SECRET);

      const socket = client();
      socket.emit("sync", OTHER_TEAM_MATCH, playerID, credentials, 2);
      await syncBehind(socket);

      expect(transport.queueFor(OTHER_TEAM_MATCH)).toBeUndefined();
    });

    // boardgame.io keeps a queue for every match id an update names, and
    // drops only those of matches a socket joined.
    it("keeps an update with made-up credentials away from boardgame.io", async () => {
      const { db, client, transport } = await serve();
      createKnownMatch(db);

      const socket = client();
      socket.emit("update", move("made up"), 0, MADE_UP_MATCH, "0");
      socket.emit("update", move("made up"), 0, KNOWN_MATCH, "0");
      await syncBehind(socket);

      expect(transport.queueFor(MADE_UP_MATCH)).toBeUndefined();
      expect(db.fetch(KNOWN_MATCH, { state: true }).state?._stateID).toBe(0);
    });

    // socket.io sends what it buffered while disconnected before the sync
    // reconnecting sends, so a move cannot rely on a sync before it.
    it("plays a move sent before the socket's first sync", async () => {
      const { db, client, drained } = await serve();
      createKnownMatch(db);

      const socket = client();
      socket.emit("update", move(TEAM_SECRET), 0, KNOWN_MATCH, "0");
      await syncBehind(socket);
      await drained(KNOWN_MATCH);

      expect(db.fetch(KNOWN_MATCH, { state: true }).state?._stateID).toBe(1);
    });

    it("stops reading for an address's failures once it has spent its allowance", async () => {
      const { db, client } = await serve({ failed: { limit: 2, windowMs: 60_000 } });
      createKnownMatch(db);
      const reads = readsOtherThanKnown(db);

      const guessing = client("192.0.2.1");
      for (let i = 0; i < 4; i++) guessing.emit("sync", MADE_UP_MATCH, "0", "guess", 2);
      await syncBehind(client("198.51.100.1"));

      expect(reads()).toEqual([MADE_UP_MATCH, MADE_UP_MATCH]);
    });

    // A school's teams share an address with whoever is guessing beside them.
    it("keeps serving a proved board at an address that is locked out", async () => {
      const { db, client } = await serve({ failed: { limit: 1, windowMs: 60_000 } });
      createKnownMatch(db);
      await syncBehind(client());

      const guessing = client();
      guessing.emit("sync", MADE_UP_MATCH, "0", "guess", 2);
      guessing.emit("sync", MADE_UP_MATCH, "0", "guess", 2);

      expect(await syncBehind(client())).toBe(KNOWN_MATCH);
    });
  });

  // One client must not keep the pool every match shares busy (#720).
  describe("packet budgets", () => {
    it("disconnects a socket over its own budget before its next packet reaches storage", async () => {
      const { db, client } = await serve({ socket: { limit: 3, windowMs: 60_000 } });
      createKnownMatch(db);
      const reads = readsOtherThanKnown(db);

      const socket = client();
      const disconnected = disconnectedBy(socket);
      for (let i = 0; i < 3; i++) socket.emit("sync", KNOWN_MATCH, "0", TEAM_SECRET, 2);
      socket.emit("sync", MADE_UP_MATCH, "0", "guess", 2);

      expect(await disconnected).toBe("io server disconnect");
      expect(reads()).toEqual([]);
    });

    // A socket costs nothing to open, so a budget that a new one refilled
    // would bound nothing.
    it("shares a team's budget between its sockets, and keeps it when it reconnects", async () => {
      const { db, client } = await serve({ team: { limit: 3, windowMs: 60_000 } });
      createKnownMatch(db);

      await syncBehind(client());
      await syncBehind(client());
      const third = client();
      await syncBehind(third);
      const gone = disconnectedBy(third);
      third.emit("sync", KNOWN_MATCH, "0", TEAM_SECRET, 2);
      expect(await gone).toBe("io server disconnect");

      const reconnected = client();
      const goneAgain = disconnectedBy(reconnected);
      reconnected.emit("sync", KNOWN_MATCH, "0", TEAM_SECRET, 2);
      expect(await goneAgain).toBe("io server disconnect");
    });

    // A team flooding cuts off its own boards, and nobody else's at its address.
    it("leaves another team served", async () => {
      const { db, client } = await serve({ team: { limit: 1, windowMs: 60_000 } });
      createKnownMatch(db);
      createKnownMatch(db, OTHER_TEAM_MATCH, OTHER_TEAM_SECRET);

      const flooding = client();
      const gone = disconnectedBy(flooding);
      for (let i = 0; i < 2; i++) flooding.emit("sync", KNOWN_MATCH, "0", TEAM_SECRET, 2);
      await gone;

      expect(await syncBehind(client(), OTHER_TEAM_MATCH, OTHER_TEAM_SECRET)).toBe(OTHER_TEAM_MATCH);
    });
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
