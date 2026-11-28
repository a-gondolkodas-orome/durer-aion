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
import { join } from "node:path";
import { io as connect, Socket } from "socket.io-client";
import { createMatch } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { Server } from "boardgame.io/server";
import { askingBotWrapper, botWrapper, gameWrapper } from "game";
import type { MatchBot } from "game";
import { MyGameWrappers } from "game/strategy";
import { StrategyWrappers } from "game/bot";
import { strategyGameName } from "schemas";
import { BOT_ID, SocketIOButBotMoves, type BotFailureMode } from "./socketio_botmoves";
import { BotPool } from "./bot_pool";

const GAME_NAME = strategyGameName("minta-ketkupac");
const game = { ...gameWrapper(MyGameWrappers["minta-ketkupac"]()), name: GAME_NAME };
const HUMAN_ID = "0";
// Each test gets its own server and its own store, so one id is enough — and
// a second, for a test of one match holding up another.
const MATCH_ID = "match-under-test";
const OTHER_MATCH_ID = "another-team's-match";
/** What the router puts on the team's seat of every match it creates; the
 *  socket guard lets nothing through without it. */
const TEAM_CREDENTIALS = "the-team's";
const BOT_CREDENTIALS = "bot-credentials-for-this-test";

type KetkupacBot = ReturnType<typeof StrategyWrappers["minta-ketkupac"]>;

/** How long a step may take before the test calls it a hang. The bot pauses
 *  400ms for UX (botwrapper.ts) and then the move travels back, so this is
 *  generous rather than tight — a broken transport does not answer at all. */
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

  /** Starts the server, by default as the competition runs it. The bot runs
   *  its strategy in-process unless a test hands it another. */
  async function startServer(
    botFailure: BotFailureMode = "recover",
    served = game,
    bot: MatchBot = new (botWrapper(botStrategy))({ enumerate: served.ai?.enumerate }),
  ): Promise<void> {
    server = Server({
      games: [served],
      // No `db`, so boardgame.io hands us its in-memory store — the transport
      // is what this file is about, not what persists behind it.
      transport: new SocketIOButBotMoves(
        { https: undefined },
        { [GAME_NAME]: bot },
        {},
        botFailure,
      ),
      // Set, rather than left out, so the server does not warn about CORS.
      origins: [],
    });
    // Port 0: the OS picks a free one, so a developer's own stack on :8000 is
    // not something this suite can collide with.
    running = await server.run(0);
    url = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  }

  /** The same, in another mode, with another game or another bot. */
  async function restartServer(botFailure: BotFailureMode, served = game, bot?: MatchBot): Promise<void> {
    server.kill(running);
    await startServer(botFailure, served, bot);
  }

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
    await startServer();
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
  async function createStoredMatch(matchID = MATCH_ID, setupData: unknown = undefined): Promise<void> {
    const match = createMatch({ game, numPlayers: 2, setupData, unlisted: true });
    if ("setupDataError" in match) throw new Error(match.setupDataError);
    match.metadata.players[0].credentials = TEAM_CREDENTIALS;
    match.metadata.players[1].credentials = BOT_CREDENTIALS;
    await server.db.createMatch(matchID, match);
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
  async function startLiveGame(socket: Socket, from: BgioState, matchID = MATCH_ID): Promise<BgioState> {
    const botAnswered = updateMatching(
      socket,
      ({ ctx }) => ctx.phase === "chooseRole" && ctx.currentPlayer === HUMAN_ID,
    );
    socket.emit(
      "update",
      makeMove("chooseNewGameType", ["live"], HUMAN_ID),
      from._stateID,
      matchID,
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

  /** Plays the team's way to its first take in a live game, and makes it:
   *  the turn is then the bot's, in the play phase. */
  async function teamTakes(socket: Socket, matchID = MATCH_ID, setupData?: unknown): Promise<void> {
    await createStoredMatch(matchID, setupData);
    const live = await startLiveGame(socket, await syncAs(socket, matchID, HUMAN_ID), matchID);
    const playing = updateMatching(socket, ({ ctx }) => ctx.phase === "play");
    socket.emit("update", makeMove("chooseRole", [HUMAN_ID], HUMAN_ID), live._stateID, matchID, HUMAN_ID);
    const play = await playing;
    const chosen = updateMatching(socket, ({ G }) => G.selectedPile === 1);
    socket.emit("update", makeMove("selectPile", [1], HUMAN_ID), play._stateID, matchID, HUMAN_ID);
    const halfway = await chosen;
    socket.emit("update", makeMove("take", [1, 1], HUMAN_ID), halfway._stateID, matchID, HUMAN_ID);
  }

  /** The bot's strategy in play only, the real one for the opening. */
  function inPlay(play: KetkupacBot): KetkupacBot {
    const real = StrategyWrappers["minta-ketkupac"]();
    return (state, botID) => state.ctx.phase === "play" ? play(state, botID) : real(state, botID);
  }
  // More tokens than any pile holds.
  const refusedTake = inPlay(() => [[0, 9], "take"]);
  const throwing = inPlay(() => { throw new Error("no entry for this position"); });

  /** The bot's failure notes in the stored match log, oldest first. */
  async function failureNotes(): Promise<unknown[]> {
    const { log } = await server.db.fetch(MATCH_ID, { log: true });
    return (log ?? []).filter(entry => entry.action.payload?.type === "noteBotFailure")
      .map(entry => (entry.metadata as { botFailure?: string } | undefined)?.botFailure);
  }

  /** The team's first take, and the state once the turn is the team's again. */
  async function teamTakesAndBotAnswers(socket: Socket, matchID = MATCH_ID, setupData?: unknown): Promise<BgioState> {
    const answered = updateMatching(socket, ({ G, ctx }) =>
      ctx.phase === "play" && ctx.currentPlayer === HUMAN_ID && G.piles[0] + G.piles[1] < 8);
    await teamTakes(socket, matchID, setupData);
    return await answered;
  }

  it.each([
    ["names a move the game refuses", refusedTake, /named take\(\[0,9\]\), which the game refused/],
    ["throws", throwing, /threw no entry for this position/],
  ])("plays a random legal move when the bot %s, and notes it in the match log", async (_case, failing, reason) => {
    strategy = failing;
    // boardgame.io reports every move it rejects.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const socket = await connectClient();

    const state = await teamTakesAndBotAnswers(socket);

    expect(state.G.selectedPile).toBeNull();
    expect(await failureNotes()).toStrictEqual([expect.stringMatching(reason)]);
    expect(warnings).toHaveBeenCalledWith(expect.stringMatching(/played take\(\[\d,\d\]\) instead/));
  });

  it.each([
    ["names a move the game refuses", refusedTake, /named take\(\[0,9\]\), which the game refused; the match waits on the bot/],
    ["throws", throwing, /threw no entry for this position; the match waits on the bot/],
  ])("stalls, and says so on the board, when the bot %s and the server is set to stall", async (_case, failing, reason) => {
    await restartServer("stall");
    strategy = failing;
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const socket = await connectClient();
    const stuck = updateMatching(socket, ({ G }) => (G as { botStuck?: boolean }).botStuck === true);

    await teamTakes(socket);
    const state = await stuck;

    expect(state.ctx.currentPlayer).toBe(BOT_ID);
    expect(state.G.piles).toStrictEqual([3, 5]);
    expect(errors).toHaveBeenCalledWith(expect.stringMatching(reason));
    expect(await failureNotes()).toHaveLength(1);
  });

  it("stalls when the game lists no move to play instead", async () => {
    await restartServer("recover", { ...game, ai: { enumerate: () => [] } });
    strategy = refusedTake;
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const socket = await connectClient();
    const stuck = updateMatching(socket, ({ G }) => (G as { botStuck?: boolean }).botStuck === true);

    await teamTakes(socket);
    await stuck;

    expect(errors).toHaveBeenCalledWith(expect.stringMatching(/which the game refused; the match waits on the bot/));
  });

  it("frees a stuck match once the bot moves again", async () => {
    await restartServer("stall");
    strategy = throwing;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const first = await connectClient();
    const stuck = updateMatching(first, ({ G }) => (G as { botStuck?: boolean }).botStuck === true);
    await teamTakes(first);
    await stuck;

    // The fix deployed: the team reloads, and the sync asks the bot again.
    strategy = StrategyWrappers["minta-ketkupac"]();
    const reloaded = await connectClient();
    const freed = updateMatching(reloaded, ({ ctx }) => ctx.currentPlayer === HUMAN_ID);
    await syncAs(reloaded, MATCH_ID, HUMAN_ID);

    expect((await freed).G).not.toHaveProperty("botStuck");
  });

  it("warns when the strategy takes longer than its budget, and plays its move", async () => {
    const real = StrategyWrappers["minta-ketkupac"]();
    strategy = (state, botID) => {
      if (state.ctx.phase === "play") {
        const until = Date.now() + 150;
        while (Date.now() < until) { /* the slow corner of a search */ }
      }
      return real(state, botID);
    };
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const socket = await connectClient();

    await teamTakesAndBotAnswers(socket);

    expect(warnings).toHaveBeenCalledWith(expect.stringMatching(/took \d+ ms to name a move, over its 100 ms/));
    expect(await failureNotes()).toStrictEqual([]);
  });

  /** A bot as the server runs one, its strategy in a worker, in play only:
   *  the fixture worker plays nothing else, so the opening is the real
   *  strategy's, in-process. The fixture does what the match's setup data
   *  says (fixtures/strategy_worker.mjs). */
  async function startServerWithWorkers(deadlineMs: number): Promise<void> {
    const pool = new BotPool({
      worker: join(__dirname, "fixtures", "strategy_worker.mjs"),
      deadlineMs,
      workerData: { mode: "ketkupac" },
    });
    await pool.start();
    onTestFinished(() => pool.close());
    const opening = new (botWrapper(StrategyWrappers["minta-ketkupac"]()))({ enumerate: game.ai?.enumerate });
    class InPlay extends askingBotWrapper((state, botID, setupData) => pool.ask(GAME_NAME, state, botID, setupData)) {
      override play(...args: Parameters<MatchBot["play"]>): ReturnType<MatchBot["play"]> {
        return args[0].ctx.phase === "play" ? super.play(...args) : opening.play(...args);
      }
    }
    await restartServer("recover", game, new InPlay({ enumerate: game.ai?.enumerate }));
  }

  it("serves another match while a strategy loops, and takes the failure path at its deadline", async () => {
    await startServerWithWorkers(1000);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await createStoredMatch(OTHER_MATCH_ID);
    const looping = await connectClient();
    const other = await connectClient();
    let recovered = false;

    const answered = teamTakesAndBotAnswers(looping, MATCH_ID, { loop: true })
      .then(state => { recovered = true; return state; });
    // Past the bot's pause, into the loop.
    await new Promise(resolve => setTimeout(resolve, 700));
    const started = Date.now();
    await syncAs(other, OTHER_MATCH_ID, HUMAN_ID);

    expect(Date.now() - started).toBeLessThan(300);
    expect(recovered).toBe(false);
    expect((await answered).G.selectedPile).toBeNull();
    expect(await failureNotes()).toStrictEqual([
      expect.stringMatching(/missed its 1000 ms deadline, and its worker was replaced/),
    ]);
    expect(warnings).toHaveBeenCalledWith(expect.stringMatching(/played take\(\[\d,\d\]\) instead/));
  });

  it("plays a strategy's move that takes a second, and answers another match's bot meanwhile", async () => {
    await startServerWithWorkers(2000);
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const [slowSocket, quickSocket] = [await connectClient(), await connectClient()];
    const finished: string[] = [];

    await Promise.all([
      teamTakesAndBotAnswers(slowSocket, MATCH_ID, { sleepMs: 1000 }).then(() => finished.push("slow")),
      teamTakesAndBotAnswers(quickSocket, OTHER_MATCH_ID, {}).then(() => finished.push("quick")),
    ]);

    expect(finished).toStrictEqual(["quick", "slow"]);
    expect(await failureNotes()).toStrictEqual([]);
    expect(warnings).toHaveBeenCalledWith(expect.stringMatching(/took \d+ ms to name a move, over its 100 ms/));
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
