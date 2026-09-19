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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressInfo } from "node:net";
import { io as connect, Socket } from "socket.io-client";
import { Client } from "boardgame.io/client";
import { createMatch } from "boardgame.io/internal";
import { Server } from "boardgame.io/server";
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

describe("the socket transport a browser talks to", () => {
  let server: BgioServer;
  let running: RunningServers;
  let url: string;
  const sockets: Socket[] = [];

  beforeEach(async () => {
    // boardgame.io announces the port it bound on, and the bot transport logs
    // each turn it takes. Both are the code under test talking, so the spy
    // stands in for the recorder in vitest.setup.mts for this file.
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    // What the bot signs its moves with; the server reads it from the
    // environment (server/common.ts) and refuses to start without it.
    vi.stubEnv("BOT_CREDENTIALS", "bot-credentials-for-this-test");

    server = Server({
      games: [game],
      // No `db`, so boardgame.io hands us its in-memory store — the transport
      // is what this file is about, not what persists behind it.
      transport: new SocketIOButBotMoves(
        { https: undefined },
        { [GAME_NAME]: new (botWrapper(StrategyWrappers.E()))({ enumerate: game.ai?.enumerate }) },
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
