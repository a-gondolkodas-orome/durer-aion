/*
 * The socket layer is the round, and nothing else in the suite crosses it: the
 * other tests call the game and the router directly. So this one starts the
 * real server — boardgame.io's `Server` with the transport this app ships —
 * listens on a real port, and drives it with the same `socket.io-client` the
 * browser bundle carries. What it is here to catch is the two halves ceasing to
 * understand each other (#461): they are separate installs of separate
 * packages, and a client that cannot sync is a round nobody can play, on a tree
 * that installs and typechecks perfectly. That they stay *one* install of
 * socket.io on the server side is scripts/socketio-single-copy.test.mjs.
 *
 * Still no substitute for the round against `npm run stack:up`: nginx and the
 * built frontend are not in front of this, and postgres is not behind it.
 */
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { AddressInfo } from "node:net";
import { io as connect, Socket } from "socket.io-client";
import { Client } from "boardgame.io/client";
import { createMatch } from "boardgame.io/internal";
import { Server } from "boardgame.io/server";
import type { Bot } from "boardgame.io/ai";
import { MyGameWrappers, gameWrapper, strategyNames } from "game";
import { StrategyWrappers } from "game/bot";
import botWrapper from "./botwrapper";
import { BOT_ID, SocketIOButBotMoves, fetch as fetchMatch } from "./socketio_botmoves";
import { getBotCredentials } from "./server/common";

const GAME_NAME = strategyNames.E;
const game = { ...gameWrapper(MyGameWrappers.E()), name: GAME_NAME };
const HUMAN_ID = "0";
// Each test gets its own server and its own store, so one id is enough.
const MATCH_ID = "match-under-test";
/** Stands in for what `server/team_manage.ts` injects into a real match. Only
 *  the tests that need boardgame.io to ask for credentials use it — it is
 *  having them at all that turns the check on. */
const TEAM_CREDENTIALS = "the-team's-credentials";

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
  G: { stonesLeft: number; stonesRight: number; difficulty: string | null };
  _stateID: number;
}

const makeMove = (type: string, args: unknown[], playerID: string) =>
  ({ type: "MAKE_MOVE", payload: { type, args, playerID } });

/** The real judge, and the two the tests need to hold still. Both keep the
 *  strategy and change only when it answers, so what they play is what the
 *  round would play. */
const RealBot = botWrapper(StrategyWrappers.E());

describe("the socket transport a browser talks to", () => {
  let server: BgioServer;
  let running: RunningServers;
  let url: string;
  const sockets: Socket[] = [];

  /** The one the tests share, unless a test replaces it: the real judge, the
   *  in-memory store, and the wait on a judge's turn left at its default. */
  async function startServer(bot: Bot = new RealBot({ enumerate: game.ai?.enumerate }), syncBotTurnWaitMs?: number) {
    server = Server({
      games: [game],
      // No `db`, so boardgame.io hands us its in-memory store — the transport
      // is what this file is about, not what persists behind it.
      transport: new SocketIOButBotMoves(
        { https: undefined },
        { [GAME_NAME]: bot },
        undefined,
        syncBotTurnWaitMs,
      ),
      // Set, rather than left out, so the server does not warn about CORS.
      origins: [],
    });
    // Port 0: the OS picks a free one, so a developer's own stack on :8000 is
    // not something this suite can collide with.
    running = await server.run(0);
    url = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  }

  /** Throws the shared server away and starts one built for this test. Two of
   *  them need a judge they can hold still, or a wait they can outlast; the
   *  rest want the defaults, so the cost of building it twice falls only on
   *  the two. */
  async function restartServerWith(bot: Bot, syncBotTurnWaitMs?: number) {
    server.kill(running);
    await startServer(bot, syncBotTurnWaitMs);
  }

  beforeEach(async () => {
    // boardgame.io announces the port it bound on, and the bot transport logs
    // each turn it takes. Both are the code under test talking, so the spy
    // stands in for the recorder in vitest.setup.mts for this file.
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    // What the bot signs its moves with; the server reads it from the
    // environment (server/common.ts) and refuses to start without it.
    vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");

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

  /** A match as the router makes one, straight into the server's store.
   *
   *  With `teamCredentials`, both players are given theirs the way
   *  `server/team_manage.ts` does — the team's and the bot's. It has to be both
   *  or neither: boardgame.io asks for credentials on a match where *any*
   *  player has them, so injecting only the team's would have the bot's own
   *  move refused, and a test could then pass because the bot was never
   *  allowed to play rather than because it was never asked. Left out, the
   *  match asks for none, which is what every other test here wants. */
  async function createStoredMatch(teamCredentials?: string): Promise<void> {
    const match = createMatch({ game, numPlayers: 2, setupData: undefined, unlisted: true });
    if ("setupDataError" in match) throw new Error(match.setupDataError);
    if (teamCredentials !== undefined) {
      match.metadata.players[HUMAN_ID].credentials = teamCredentials;
      match.metadata.players[BOT_ID].credentials = getBotCredentials();
    }
    await server.db.createMatch(MATCH_ID, match);
  }

  async function syncAs(socket: Socket, matchID: string, playerID: string): Promise<BgioState> {
    const synced = nextEvent(socket, "sync");
    socket.emit("sync", matchID, playerID, undefined, 2);
    const [, payload] = await synced as [string, { state: BgioState; }];
    return payload.state;
  }

  /** The player starts a live game; the bot answers it with the opening
   *  position, which is the first thing it decides in a match. So the state
   *  this resolves with is a whole round trip: player packet in, state through
   *  the game, bot packet out. */
  async function startLiveGame(socket: Socket, from: BgioState): Promise<BgioState> {
    const botAnswered = updateMatching(socket, ({ G }) => G.stonesLeft > 0);
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
    expect(state.G.stonesRight).toBeGreaterThan(0);
    // The bot took the judge's turn, so it is the player's again.
    expect(state.ctx.currentPlayer).not.toBe(BOT_ID);
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

  /** A match state on the judge's turn, played out by a local client rather
   *  than assembled by hand — the same move `startLiveGame` sends, with nobody
   *  to answer it. That is what the store holds when the bot's move never
   *  happened: the backend restarted mid-turn, or the bot's own update lost a
   *  stateID race. */
  function stateOnTheJudgesTurn() {
    const scratch = Client({ game, numPlayers: 2, playerID: HUMAN_ID });
    scratch.start();
    scratch.moves.chooseNewGameType("live");
    const state = scratch.store.getState();
    scratch.stop();
    return state;
  }

  /** The regression: a player's move used to be the only thing that asked the
   *  bot to play, so a match left on the judge's turn stayed there however
   *  often the team came back to it (#133).
   *
   *  Asserted on the sync's own answer rather than on a later `update`: the
   *  turn is taken in front of boardgame.io's sync handler, so the state it
   *  reads back out of storage already carries the bot's move. There is no
   *  push to wait for here, which is the point — the socket is not yet on the
   *  match's channel to receive one. */
  it("plays the judge's turn a team comes back to", async () => {
    await createStoredMatch();
    const stuck = stateOnTheJudgesTurn();
    expect(stuck.ctx.currentPlayer).toBe(BOT_ID);
    await server.db.setState(MATCH_ID, stuck);

    const state = await syncAs(await connectClient(), MATCH_ID, HUMAN_ID);

    expect(state.G.stonesRight).toBeGreaterThan(0);
    expect(state.ctx.currentPlayer).not.toBe(BOT_ID);
  });

  /** The credential check belongs to boardgame.io's `Master.onSync`, which
   *  answers a sync it refuses with nothing at all. The bot's turn is taken in
   *  front of that, so it makes the same check itself — otherwise anyone who
   *  learned a matchID could drive a competition match along. */
  it("leaves the judge's turn alone for a sync it cannot authenticate", async () => {
    await createStoredMatch(TEAM_CREDENTIALS);
    await server.db.setState(MATCH_ID, stateOnTheJudgesTurn());

    const socket = await connectClient();
    socket.emit("sync", MATCH_ID, HUMAN_ID, "not-the-team's-credentials", 2);
    // Asserting a non-event, so it is waited out rather than awaited: the bot
    // pauses 400ms for UX (botwrapper.ts) and the store is in memory, so a
    // turn that was going to be taken has been by now.
    await new Promise(resolve => setTimeout(resolve, 1200));

    const { state } = await fetchMatch(server.db, MATCH_ID, { state: true } as const);
    expect(state.ctx.currentPlayer).toBe(BOT_ID);
  });

  /** The judge held mid-turn, so a reload can land inside one. It plays the
   *  real strategy once let go — what the test is about is when it answers,
   *  not what it answers — and the pause the real one keeps for UX is dropped,
   *  since the holding is the pause here. */
  function heldJudge() {
    const asked: number[] = [];
    let arrive = (): void => undefined;
    const beenAsked = new Promise<void>(resolve => { arrive = resolve; });
    let letGo = (): void => undefined;
    const released = new Promise<void>(resolve => { letGo = resolve; });

    class HeldBot extends RealBot {
      async wait(): Promise<void> {
        // The 400ms the real one keeps for UX; here the test decides.
      }
      async play(...args: Parameters<InstanceType<typeof RealBot>["play"]>): ReturnType<Bot["play"]> {
        asked.push(args[0]._stateID);
        arrive();
        await released;
        return super.play(...args);
      }
    }

    return {
      bot: new HeldBot({ enumerate: game.ai?.enumerate }),
      asked,
      beenAsked,
      release: () => { letGo(); },
    };
  }

  /** The invariant `takeBotTurn` rests on: a player's move and a reconnect
   *  both ask for the judge's turn, and whichever runs second finds it already
   *  taken. It is the match's queue that makes that true — and boardgame.io
   *  drops that queue the moment a match's last client disconnects, which is
   *  what a reload is. Asked twice at the same stateID, the judge decides
   *  twice, and `Master.onUpdate` broadcasts before it persists, so the two
   *  answers can interleave and leave the team on a position storage did not
   *  keep. */
  it("asks the judge once when a reload lands inside its turn", async () => {
    const judge = heldJudge();
    await restartServerWith(judge.bot);
    await createStoredMatch();

    const first = await connectClient();
    const before = await syncAs(first, MATCH_ID, HUMAN_ID);
    first.emit("update", makeMove("chooseNewGameType", ["live"], HUMAN_ID), before._stateID, MATCH_ID, HUMAN_ID);
    await judge.beenAsked;

    // The reload, with the judge still thinking: the last client leaving is
    // what has boardgame.io drop the queue.
    first.disconnect();
    // Waited out rather than awaited: the server learns of a disconnect on its
    // own schedule, and it is what that disconnect does to the queue that this
    // test is about. Long enough for a loopback socket to have closed.
    await new Promise(resolve => setTimeout(resolve, 300));
    const second = await connectClient();
    const synced = syncAs(second, MATCH_ID, HUMAN_ID);
    // On a queue of its own the reconnect asks the judge again straight away,
    // so this is long enough for a second question to have been put.
    await new Promise(resolve => setTimeout(resolve, 300));
    judge.release();

    expect(judge.asked).toHaveLength(1);
    const answered = await synced;
    // The answer carries the turn, and it is the one storage kept.
    expect(answered.ctx.currentPlayer).not.toBe(BOT_ID);
    const { state } = await fetchMatch(server.db, MATCH_ID, { state: true } as const);
    expect(answered._stateID).toBe(state._stateID);
    expect(answered.G).toStrictEqual(state.G);
  });

  /** The wait `resumeBotTurn` puts on the judge has to be bounded. This is the
   *  packet boardgame.io answers *and* registers the socket on, so a turn that
   *  never came back would not only lose this answer — it would leave the
   *  socket off the match's channel, where no later push could reach it
   *  either. Never is not recoverable; late is, below. */
  it("answers a sync whose judge's turn never comes back", async () => {
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    onTestFinished(() => { warned.mockRestore(); });
    class SilentBot extends RealBot {
      play(): ReturnType<Bot["play"]> {
        return new Promise<never>(() => undefined);
      }
    }
    await restartServerWith(new SilentBot({ enumerate: game.ai?.enumerate }), 200);
    await createStoredMatch();
    await server.db.setState(MATCH_ID, stateOnTheJudgesTurn());

    const state = await syncAs(await connectClient(), MATCH_ID, HUMAN_ID);

    // Late, not wrong: the stored state, with the judge still to move.
    expect(state.ctx.currentPlayer).toBe(BOT_ID);
    expect(warned).toHaveBeenCalledWith(expect.stringContaining(MATCH_ID));
  });

  /** The regression: a turn that outlasted the wait used to be published to
   *  a channel the socket was not on yet if it ended before `addClient`, while
   *  the answer already sent carried the state from before it — so the team
   *  was back on the judge's turn, and only another reload would have moved
   *  them off it. Now the socket is answered a second time once the turn is
   *  over, and that answer carries the move. */
  it("answers again, with the judge's move, once a turn that outlasted the wait is over", async () => {
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    onTestFinished(() => { warned.mockRestore(); });
    const judge = heldJudge();
    await restartServerWith(judge.bot, 200);
    await createStoredMatch();
    await server.db.setState(MATCH_ID, stateOnTheJudgesTurn());

    const socket = await connectClient();
    const first = await syncAs(socket, MATCH_ID, HUMAN_ID);
    expect(first.ctx.currentPlayer).toBe(BOT_ID);
    expect(warned).toHaveBeenCalledWith(expect.stringContaining(MATCH_ID));

    const again = nextEvent(socket, "sync");
    judge.release();
    const [, payload] = await again as [string, { state: BgioState; }];

    expect(judge.asked).toHaveLength(1);
    expect(payload.state.ctx.currentPlayer).toBe(HUMAN_ID);
    expect(payload.state._stateID).toBe(first._stateID + 1);
    const { state } = await fetchMatch(server.db, MATCH_ID, { state: true } as const);
    expect(payload.state.G).toStrictEqual(state.G);
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
    // socketio_botmoves.ts rejects it before boardgame.io's listener sees it,
    // which is what stops anonymous traffic from writing matches into storage.
    expect(heard).toStrictEqual([]);
    expect(socket.connected).toBe(true);
  });
});
