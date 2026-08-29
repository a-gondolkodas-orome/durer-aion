import { describe, test, beforeEach, expect, vi } from "vitest";
import { gameWrapper } from "./gamewrapper";
import { Client } from "boardgame.io/client";
import {
  createGameWithoutStartingPosition,
  createGameWithMoveWithoutStartingPosition,
} from "./game_for_testing";

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
