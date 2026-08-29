import { describe, test, expect } from "vitest";
import { Client } from "boardgame.io/client";
import { GameRelay } from "./game";

// Regression: the first problem's max points came hardcoded as 3 (setup) and the
// firstProblem move dropped the value the strategy sent, so a problem set whose
// first problem is worth 2 points scored 3 for it.
describe("GameRelay first problem points", () => {
  test("firstProblem sets the max points the judge sends", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first problem text", 2, "");

    expect(client.getState()?.G.currentProblemMaxPoints).toStrictEqual(2);
  });

  test("a first-try correct answer scores the problem's own points", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first problem text", 2, "");
    client.moves.submitAnswer(120);
    client.moves.newProblem("second problem text", 3, true, "");

    expect(client.getState()?.G.points).toStrictEqual(2);
    expect(client.getState()?.G.previousPoints[0]).toStrictEqual(2);
    expect(client.getState()?.G.currentProblemMaxPoints).toStrictEqual(3);
  });
});
