import { describe, test, afterEach, beforeEach, expect, vi, type MockInstance } from "vitest";
import { gameWrapper, isMakeMovePayloadReadOnly, LATE_MOVE_GRACE_MS } from "./gamewrapper";
import { Client } from "boardgame.io/client";
import {
  createGameWithoutStartingPosition,
  createGameWithMoveWithoutStartingPosition,
} from "./game_for_testing";
import { GUESSER_PLAYER, JUDGE_PLAYER, strategyPoints, type GameType } from "./types";

describe("gameWrapper", () => {
  const setup = vi.fn();

  const move = vi.fn();
  const startingPosition = vi.fn();
  const wrappedGame = gameWrapper(
    createGameWithMoveWithoutStartingPosition(setup, move)
  );

  beforeEach(() => {
    vi.resetAllMocks();

    setup.mockReturnValue({ data: "setup" });
    startingPosition.mockReturnValue({ data: "startingPosition" });
  });

  test("whether client calls into wrapped setup", () => {
    Client({ game: wrappedGame, numPlayers: 2 });
    expect(setup).toHaveBeenCalled();
  });

  test("whether default state is consistent", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.data).toStrictEqual("setup");
  });

  test("chooseNewGameType", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });

    expect(client.getState()?.ctx.phase).toStrictEqual("chooseRole");
    expect(client.getState()?.G.data).toStrictEqual("startingPosition");
  });

  test("chooseRole", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });

    client.moves.chooseRole("0");
    expect(client.getState()?.ctx.phase).toStrictEqual("play");
  });

  test("move", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    move.mockImplementation(({ G }, newData) => {
      return {
        ...G,
        data: newData,
      };
    });
    client.moves.move("move");

    expect(move).toHaveBeenCalled();
    expect(client.getState()?.G.data).toStrictEqual("move");
  });
});

describe("gameWrapper high-level logic", () => {
  const setup = () => ({ data: "asd" });
  const wrappedGame = gameWrapper(createGameWithoutStartingPosition(setup));

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("win once", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.win();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(1);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(1);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });

  test("lose once", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.lose();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(1);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(1);
    expect(client.getState()?.G.winningStreak).toStrictEqual(0);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });

  test("win twice", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.win();

    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.win();

    expect(client.getState()?.ctx.phase).toStrictEqual(null);
    expect(client.getState()?.G.numberOfTries).toStrictEqual(2);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(2);
    expect(client.getState()?.G.points).toStrictEqual(12);
  });

  // The offline app persists the score from these reports (issue #168), so a
  // play-phase exit that stops reporting silently zeroes practice scores.
  // G is an immer draft revoked after the reducer returns, so the report's
  // values are copied at call time — as the real consumers read them.
  test("reports the end of each round with the current points", () => {
    const reports: { phase: string; points: number }[] = [];
    const client = Client({
      game: gameWrapper(createGameWithoutStartingPosition(setup), (report) => {
        reports.push({ phase: report.phase, points: report.G.points });
      }),
      numPlayers: 2,
    });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.win();

    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.win();

    const endReports = reports.filter((report) => report.phase === "end");
    expect(endReports).toStrictEqual([
      { phase: "end", points: 0 },
      { phase: "end", points: 12 },
    ]);
  });

  const startGame = (client: ReturnType<typeof Client>, difficulty: "live" | "test") => {
    client.moves.chooseNewGameType(difficulty);
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");
  };

  test("records each live game's result in order, the match-ending win included", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    const play = (difficulty: "live" | "test", move: "win" | "lose") => {
      startGame(client, difficulty);
      client.moves[move]();
    };

    play("live", "lose");
    play("test", "win");
    play("live", "win");
    play("live", "lose");
    play("live", "win");
    play("live", "win");

    expect(client.getState()?.ctx.gameover).toBeDefined();
    expect(client.getState()?.G.liveResults).toStrictEqual(["lost", "won", "lost", "won", "won"]);
    expect(client.getState()?.G.points).toStrictEqual(6);
  });

  test("records the live game the time ran out in as unfinished", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    startGame(client, "live");
    client.moves.lose();
    startGame(client, "live");

    client.events.endGame?.();

    expect(client.getState()?.G.liveResults).toStrictEqual(["lost", "unfinished"]);
  });

  test("win in test", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("test");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");

    client.moves.lose();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(0);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(0);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });
});

describe("gameWrapper clock", () => {
  const wrappedGame = gameWrapper(createGameWithoutStartingPosition(() => ({ data: "asd" })));

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // The client polls this move for the countdown it shows. It carries no time
  // of its own: the server recomputes what is left from the match's own end,
  // so a client cannot buy itself extra minutes by reporting a longer one.
  test("the time left is recomputed from the match's end on every poll", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T10:00:00Z"));
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    vi.setSystemTime(new Date("2026-03-21T10:05:00Z"));
    client.moves.getTime();

    expect(client.getState()?.G.millisecondsRemaining).toStrictEqual(25 * 60 * 1000);
    expect(client.getState()?.G.end).toStrictEqual("2026-03-21T10:30:00.000Z");
  });

  test("only the team may ask for the time", () => {
    // boardgame.io reports every move it rejects on the console, and this test
    // provokes one, so it takes the message rather than leaving it in the report.
    const rejected = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T10:00:00Z"));
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live"); // hands the turn to the judge

    vi.setSystemTime(new Date("2026-03-21T10:05:00Z"));
    client.moves.getTime();

    expect(client.getState()?.G.millisecondsRemaining).toStrictEqual(30 * 60 * 1000);
    expect(rejected).toHaveBeenCalledOnce();
  });

  // The server reacts to a team's move by letting the bot move. A clock poll is
  // not a move of the game, so the bot must not answer one.
  test("a clock poll is not something the bot should answer", () => {
    expect(isMakeMovePayloadReadOnly("getTime")).toBe(true);
    expect(isMakeMovePayloadReadOnly("chooseRole")).toBe(false);
  });
});

test("polling the clock does not spend a limited turn's move", () => {
  const oneMovePerTurn: GameType<{ data: string }> = {
    name: "stub-game",
    setup: () => ({ data: "setup" }),
    possibleMoves: () => [{ move: "step" }],
    moves: { step: ({ G }) => { G.data = "stepped"; } },
    turn: { minMoves: 1, maxMoves: 1 },
  };
  const client = Client({ game: gameWrapper(oneMovePerTurn), numPlayers: 2 });
  client.start();
  client.moves.chooseNewGameType("live");
  client.moves.setStartingPosition({ data: "startingPosition" });
  client.moves.chooseRole(GUESSER_PLAYER);

  client.moves.getTime();
  client.moves.getTime();

  expect(client.getState()?.ctx.numMoves).toStrictEqual(0);
  expect(client.getState()?.ctx.currentPlayer).toStrictEqual(GUESSER_PLAYER);
});

/// A game whose one move ends its own turn without ending the match, so the
/// play phase stays open and both sides get a turn.
function steppingGame(turnEnd = vi.fn()): GameType<{ data: string }> {
  return {
    name: "stub-game",
    setup: () => ({ data: "setup" }),
    possibleMoves: () => [{ move: "step" }],
    moves: { step: ({ G, events }) => { G.data = "stepped"; events.endTurn(); } },
    turn: { onEnd: ({ playerID }) => { turnEnd(playerID); } },
  };
}

/// A live match in the play phase with the team to move.
function playing(game: GameType<{ data: string }>) {
  const client = Client({ game: gameWrapper(game), numPlayers: 2 });
  client.start();
  client.moves.chooseNewGameType("live");
  client.moves.setStartingPosition({ data: "startingPosition" });
  client.moves.chooseRole(GUESSER_PLAYER);
  return client;
}

// Regression: the wrapper forwarded boardgame.io's `playerID` to a game's
// `turn.onEnd`, and bgio gives that hook none.
test("a game's turn.onEnd is told whose turn is ending", () => {
  const turnEnd = vi.fn();
  const client = playing(steppingGame(turnEnd));
  turnEnd.mockReset();

  client.moves.step();
  client.moves.step();

  expect(turnEnd.mock.calls.flat()).toStrictEqual([GUESSER_PLAYER, JUDGE_PLAYER]);
});

describe("gameWrapper deadline", () => {
  const START = new Date("2026-03-21T18:00:00.000Z");
  const END = new Date(START.getTime() + 30 * 60 * 1000);
  const at = (msPastTheEnd: number) => vi.setSystemTime(new Date(END.getTime() + msPastTheEnd));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("a team's move within the allowance is taken", () => {
    const client = playing(steppingGame());

    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.step();

    expect(client.getState()?.ctx.gameover).toBeUndefined();
    expect(client.getState()?.G.data).toStrictEqual("stepped");
  });

  // The one late move is played, then the match ends.
  test("a team's move past the allowance is applied and ends the match", () => {
    const client = playing(steppingGame());

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.step();

    expect(client.getState()?.G.data).toStrictEqual("stepped");
    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  test("a team's clock poll past the allowance ends the match", () => {
    const client = playing(steppingGame());

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.getTime();

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // A team that has left the page sends no move, so only the end of the bot's
  // turn can close the match.
  test("the bot answering past the allowance ends the match", () => {
    const client = playing(steppingGame());
    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.step();

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.step();

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // A match must not close while a move it has just taken is still on screen.
  test("the bot answering within the allowance leaves the match open", () => {
    const client = playing(steppingGame());
    at(1000);
    client.moves.step();

    at(2000);
    client.moves.step();

    expect(client.getState()?.ctx.gameover).toBeUndefined();
    expect(client.getState()?.ctx.currentPlayer).toStrictEqual(GUESSER_PLAYER);
  });
});

describe("gameWrapper move guards", () => {
  const wrappedGame = gameWrapper(createGameWithoutStartingPosition(() => ({ data: "setup" })));

  // Every test here provokes a move boardgame.io rejects, and it reports every
  // one of those on the console, so each takes the message it causes rather
  // than leaving it in the test report.
  let rejected: MockInstance<typeof console.error>;

  beforeEach(() => {
    rejected = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("the team cannot send the opening position the bot picks", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    client.moves.setStartingPosition({ data: "startingPosition" });

    expect(client.getState()?.G.data).toStrictEqual("setup");
    expect(rejected).toHaveBeenCalledOnce();
  });

  test("the bot cannot choose the difficulty", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live"); // hands the turn to the judge

    client.moves.chooseNewGameType("test");

    expect(client.getState()?.G.difficulty).toStrictEqual("live");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(1);
    expect(rejected).toHaveBeenCalledOnce();
  });

  test("the team cannot choose a difficulty that does not exist", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    client.moves.chooseNewGameType("expert");

    expect(client.getState()?.G.difficulty).toBeNull();
    expect(client.getState()?.ctx.currentPlayer).toStrictEqual(GUESSER_PLAYER);
    expect(rejected).toHaveBeenCalledOnce();
  });
});

describe("gameWrapper move log", () => {
  const wrappedGame = gameWrapper(createGameWithoutStartingPosition(() => ({ data: "asd" })));
  const timeOfMoves = new Date("2026-11-14T09:30:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(timeOfMoves);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("every step of a match is logged with the time it was made", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole("0");
    client.moves.win();

    const moves = client.getState()?.log.filter(entry => entry.action.type === "MAKE_MOVE");
    expect(moves?.map(entry => [entry.action.payload.type, entry.metadata])).toStrictEqual([
      ["chooseNewGameType", { time: timeOfMoves.toISOString() }],
      ["setStartingPosition", { time: timeOfMoves.toISOString() }],
      ["chooseRole", { time: timeOfMoves.toISOString() }],
      ["win", { time: timeOfMoves.toISOString() }],
    ]);
  });

  test("a clock poll is logged without a time", () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.getTime();

    const [poll] = client.getState()?.log ?? [];
    expect(poll?.action.payload.type).toStrictEqual("getTime");
    expect(poll?.metadata).toBeUndefined();
  });
});

describe("strategyPoints", () => {
  test("drops with each loss and stays at its floor after five", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(strategyPoints)).toStrictEqual([12, 9, 6, 4, 3, 2, 2]);
  });
});
