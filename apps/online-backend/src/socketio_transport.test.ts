/*
 * The socket layer is the round, and nothing else in the suite crosses it: the
 * other tests call the game and the router directly. So this one starts the
 * real server — boardgame.io's `Server` with the transport this app ships —
 * listens on a real port, and drives it with the same `socket.io-client` the
 * browser bundle carries. What it is here to catch is the two halves ceasing to
 * understand each other (#461): they are separate installs of separate
 * packages, and a client that cannot sync is a round nobody can play, on a tree
 * that installs and typechecks perfectly. That they stay *one* install of
 * socket.io on the server side is socketio-single-copy.test.mjs.
 *
 * Still no substitute for the round against `npm run stack:up`: nginx and the
 * built frontend are not in front of this, and postgres is not behind it.
 */
import { AddressInfo } from "node:net";
import { io as connect, Socket } from "socket.io-client";
import { createMatch } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { Server } from "boardgame.io/server";
import { MyGameWrappers, botWrapper, gameWrapper } from "game";
import { StrategyWrappers } from "game/bot";
import { strategyGameName } from "schemas";
import { BOT_ID, SocketIOButBotMoves } from "./socketio_botmoves";

const GAME_NAME = strategyGameName("minta-ketkupac");
const game = { ...gameWrapper(MyGameWrappers["minta-ketkupac"]()), name: GAME_NAME };
const HUMAN_ID = "0";
// Each test gets its own server and its own store, so one id is enough.
const MATCH_ID = "match-under-test";
/** What the router puts on the team's seat of every match it creates; the
 *  socket guard lets nothing through without it. */
const TEAM_CREDENTIALS = "the-team's";
const BOT_CREDENTIALS = "bot-credentials-for-this-test";

type KetkupacBot = ReturnType<typeof StrategyWrappers["minta-ketkupac"]>;

/** How long a step may take before the test calls it a hang. The bot answers
 *  at once, so this is generous rather than tight — a broken transport does
 *  not answer at all. */
const REPLY_TIMEOUT = 3000;

type BgioServer = ReturnType<typeof Server>;
type RunningServers = Awaited<ReturnType<BgioServer["run"]>>;

/** Resolves with the first `event` the socket receives, or rejects on timeout. */
function nextEvent(socket: Socket, event: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`no '${event}' within ${REPLY_TIMEOUT}ms`));
    }, REPLY_TIMEOUT);
    function onEvent(...args: unknown[]) {
      clearTimeout(timer);
      resolve(args);
    }
    socket.once(event, onEvent);
  });
}

/** The `update` whose state satisfies `done`, skipping the ones before it: one
 *  player move produces several — the move itself, then the bot's answer. */
function updateMatching(socket: Socket, done: (state: BgioState) => boolean): Promise<BgioState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("update", onUpdate);
      reject(new Error(`no matching 'update' within ${REPLY_TIMEOUT}ms`));
    }, REPLY_TIMEOUT);
    function onUpdate(_matchID: string, state: BgioState) {
      if (!done(state)) return;
      clearTimeout(timer);
      socket.off("update", onUpdate);
      resolve(state);
    }
    socket.on("update", onUpdate);
  });
}

/** Only the fields these assertions read. */
interface BgioState {
  ctx: { phase: string; currentPlayer: string };
  G: { difficulty: string | null; piles: number[]; selectedPile: number | null };
  _stateID: number;
}

const makeMove = (type: string, args: unknown[], playerID: string) =>
  ({ type: "MAKE_MOVE", payload: { type, args, playerID, credentials: TEAM_CREDENTIALS } });

describe("the socket transport a browser talks to", () => {
  let server: BgioServer;
  let running: RunningServers;
  let url: string;
  const sockets: Socket[] = [];

  /** The bot's strategy, which a test may replace before the bot plays. */
  let strategy: KetkupacBot;
  const botStrategy: KetkupacBot = (state, botID) => strategy(state, botID);

  beforeEach(async () => {
    strategy = StrategyWrappers["minta-ketkupac"]();
    // boardgame.io announces the port it bound on, and the bot transport logs
    // each turn it takes. Both are the code under test talking, so the spy
    // stands in for the recorder in vitest/setup.mts for this file.
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    // What the bot signs its moves with; the server reads it from the
    // environment (server/common.ts) and refuses to start without it.
    vi.stubEnv("BOT_CREDENTIALS", BOT_CREDENTIALS);

    server = Server({
      games: [game],
      // No `db`, so boardgame.io hands us its in-memory store — the transport
      // is what this file is about, not what persists behind it.
      transport: new SocketIOButBotMoves(
        { https: undefined },
        { [GAME_NAME]: new (botWrapper(botStrategy))({ enumerate: game.ai?.enumerate }) },
      ),
      // Set, rather than left out, so the server does not warn about CORS.
      origins: [],
    });
    // Port 0: the OS picks a free one, so a developer's own stack on :8000 is
    // not something this suite can collide with.
    running = await server.run(0);
    url = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  });

  afterEach(() => {
    for (const socket of sockets.splice(0)) socket.disconnect();
    server.kill(running);
    vi.unstubAllEnvs();
  });

  /** Connects to the game's namespace and waits until the socket is up. */
  async function connectClient(): Promise<Socket> {
    const socket = connect(`${url}/${GAME_NAME}`, { transports: ["websocket"] });
    sockets.push(socket);
    await nextEvent(socket, "connect");
    return socket;
  }

  /** A match as the router makes one, straight into the server's store. */
  async function createStoredMatch(): Promise<void> {
    const match = createMatch({ game, numPlayers: 2, setupData: undefined, unlisted: true });
    if ("setupDataError" in match) throw new Error(match.setupDataError);
    match.metadata.players[0].credentials = TEAM_CREDENTIALS;
    match.metadata.players[1].credentials = BOT_CREDENTIALS;
    await server.db.createMatch(MATCH_ID, match);
  }

  async function syncAs(socket: Socket, matchID: string, playerID: string): Promise<BgioState> {
    const synced = nextEvent(socket, "sync");
    socket.emit("sync", matchID, playerID, TEAM_CREDENTIALS, 2);
    const [, payload] = await synced as [string, { state: BgioState; }];
    return payload.state;
  }

  /** The player starts a live game; the bot answers it with the opening
   *  position, which is the first thing it decides in a match. So the state
   *  this resolves with is a whole round trip: player packet in, state through
   *  the game, bot packet out. */
  async function startLiveGame(socket: Socket, from: BgioState): Promise<BgioState> {
    const botAnswered = updateMatching(
      socket,
      ({ ctx }) => ctx.phase === "chooseRole" && ctx.currentPlayer === HUMAN_ID,
    );
    socket.emit(
      "update",
      makeMove("chooseNewGameType", ["live"], HUMAN_ID),
      from._stateID,
      MATCH_ID,
      HUMAN_ID
    );
    return await botAnswered;
  }

  it("hands a joining player the match state", async () => {
    await createStoredMatch();
    const state = await syncAs(await connectClient(), MATCH_ID, HUMAN_ID);

    expect(state.ctx.phase).toBe("startNewGame");
    expect(state.ctx.currentPlayer).toBe(HUMAN_ID);
  });

  it("answers a player's move with the bot's", async () => {
    await createStoredMatch();
    const socket = await connectClient();

    const state = await startLiveGame(socket, await syncAs(socket, MATCH_ID, HUMAN_ID));

    expect(state.G.difficulty).toBe("live");
    expect(state.ctx.phase).toBe("chooseRole");
    // The bot took the judge's turn, so it is the player's again.
    expect(state.ctx.currentPlayer).not.toBe(BOT_ID);
  });

  it("carries the player's move to the game, and the bot's reply back", async () => {
    await createStoredMatch();
    const socket = await connectClient();
    const live = await startLiveGame(socket, await syncAs(socket, MATCH_ID, HUMAN_ID));

    const playing = updateMatching(socket, ({ ctx }) => ctx.phase === "play");
    socket.emit("update", makeMove("chooseRole", [HUMAN_ID], HUMAN_ID), live._stateID, MATCH_ID, HUMAN_ID);
    const play = await playing;
    expect(play.ctx.currentPlayer).toBe(HUMAN_ID);

    // The player's turn is two moves: choosing a pile keeps the turn, and
    // taking from it hands the turn to the bot, whose take only its strategy,
    // run on the server, can have chosen.
    const chosen = updateMatching(socket, ({ G }) => G.selectedPile === 1);
    socket.emit("update", makeMove("selectPile", [1], HUMAN_ID), play._stateID, MATCH_ID, HUMAN_ID);
    const halfway = await chosen;
    expect(halfway.ctx.currentPlayer).toBe(HUMAN_ID);

    // The bot's turn is the same two moves, each pushed on its own (#374).
    const botChose = updateMatching(socket, ({ G, ctx }) =>
      ctx.currentPlayer === BOT_ID && G.selectedPile !== null);
    const botReplied = updateMatching(socket, ({ G, ctx }) =>
      G.piles[0] + G.piles[1] < 8 && ctx.currentPlayer === HUMAN_ID);
    socket.emit("update", makeMove("take", [1, 1], HUMAN_ID), halfway._stateID, MATCH_ID, HUMAN_ID);
    const chose = await botChose;
    const state = await botReplied;

    expect(chose.G.piles).toStrictEqual([3, 5]);
    expect(state._stateID).toBe(chose._stateID + 1);
    expect(state.G.piles[0] + state.G.piles[1]).toBeLessThan(8);
    expect(state.G.selectedPile).toBeNull();
  });

  it("plays a random move for one the game refuses, rather than leave the turn the bot's", async () => {
    await createStoredMatch();
    const socket = await connectClient();
    const live = await startLiveGame(socket, await syncAs(socket, MATCH_ID, HUMAN_ID));
    const playing = updateMatching(socket, ({ ctx }) => ctx.phase === "play");
    socket.emit("update", makeMove("chooseRole", [HUMAN_ID], HUMAN_ID), live._stateID, MATCH_ID, HUMAN_ID);
    const play = await playing;
    // What a strategy asked halfway through its turn may name: here, more
    // tokens than any pile holds.
    strategy = () => [[0, 9], "take"];
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const botReplied = updateMatching(socket, ({ ctx }) => ctx.currentPlayer === HUMAN_ID && ctx.phase === "play");
    socket.emit("update", makeMove("take", [1, 1], HUMAN_ID), play._stateID, MATCH_ID, HUMAN_ID);
    const state = await botReplied;

    expect(state.G.piles[0] + state.G.piles[1]).toBeLessThan(8);
  });

  it("gives a reconnecting player the state their last one left", async () => {
    await createStoredMatch();
    const first = await connectClient();
    const beforeReload = await startLiveGame(first, await syncAs(first, MATCH_ID, HUMAN_ID));
    first.disconnect();

    // What a browser reload is: a new socket, syncing the same match.
    const afterReload = await syncAs(await connectClient(), MATCH_ID, HUMAN_ID);
    expect(afterReload._stateID).toBe(beforeReload._stateID);
    expect(afterReload.G).toStrictEqual(beforeReload.G);
  });

  /** The judge's turn the server lost: the player's move is stored, and
   *  nothing asked the bot to answer it — what a backend restart between the
   *  two leaves. The move goes in through a master of its own, so no
   *  transport hears of it. */
  async function leaveOnJudgesTurn(): Promise<void> {
    const master = new Master(game, server.db, { send: () => undefined, sendAll: () => undefined });
    const { state } = await server.db.fetch(MATCH_ID, { state: true });
    const move = makeMove("chooseNewGameType", ["live"], HUMAN_ID) as Parameters<Master["onUpdate"]>[0];
    await master.onUpdate(move, state._stateID, MATCH_ID, HUMAN_ID);
  }

  it("takes a judge's turn nobody took when a board syncs", async () => {
    await createStoredMatch();
    await leaveOnJudgesTurn();
    const socket = await connectClient();
    const botAnswered = updateMatching(socket, ({ ctx }) => ctx.currentPlayer === HUMAN_ID);

    const stuck = await syncAs(socket, MATCH_ID, HUMAN_ID);
    expect(stuck.ctx.currentPlayer).toBe(BOT_ID);
    const state = await botAnswered;

    expect(state.ctx.phase).toBe("chooseRole");
    expect(state._stateID).toBeGreaterThan(stuck._stateID);
  });

  it("hands a syncing board the stored state once more", async () => {
    await createStoredMatch();
    const socket = await connectClient();
    const resent = updateMatching(socket, () => true);

    const synced = await syncAs(socket, MATCH_ID, HUMAN_ID);

    expect((await resent)._stateID).toBe(synced._stateID);
  });

  it("sends a sync that fails the credential check nothing more", async () => {
    await createStoredMatch();
    const socket = await connectClient();
    const heard: string[] = [];
    socket.onAny((event: string) => heard.push(event));

    socket.emit("sync", MATCH_ID, HUMAN_ID, "someone-else's", 2);
    // Past the bot's think time, which a resend would wait behind.
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(heard).not.toContain("update");
  });

  it("refuses a sync for a match nobody created", async () => {
    const socket = await connectClient();
    const heard: string[] = [];
    for (const event of ["sync", "update", "connect_error"]) {
      socket.on(event, () => heard.push(event));
    }

    socket.emit("sync", "no-such-match", HUMAN_ID, undefined, 2);
    // A refusal is silence, so there is no event to wait for: this is long
    // enough that an answer would have arrived over a loopback socket.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // The packet is dropped rather than answered — the middleware in
    // socket_guard.ts rejects it before boardgame.io's listener sees it,
    // which is what stops anonymous traffic from writing matches into storage.
    expect(heard).toStrictEqual([]);
    expect(socket.connected).toBe(true);
  });
});
