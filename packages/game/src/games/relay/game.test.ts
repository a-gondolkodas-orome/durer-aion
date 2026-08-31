import { describe, test, expect } from "vitest";
import { Client } from "boardgame.io/client";
import { GameRelay, RelayWrapper } from "./game";

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

// The offline apps persist the score from this report (issue #168), so a game
// end that stops reporting silently zeroes practice scores.
// G is an immer draft revoked after the reducer returns, so the report's
// values are copied at call time — as the real consumers read them.
describe("RelayWrapper end report", () => {
  test("ending the game reports the final points through the callback", () => {
    const reports: { phase: string; points: number }[] = [];
    const client = Client({
      game: RelayWrapper((report) => {
        reports.push({ phase: report.phase, points: report.G.points });
      }),
      numPlayers: 2,
    });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first problem text", 2, "");
    client.moves.submitAnswer(120);
    client.moves.endGame(true);

    expect(client.getState()?.ctx.gameover).toBeDefined();
    const endReports = reports.filter((report) => report.phase === "end");
    expect(endReports).toStrictEqual([{ phase: "end", points: 2 }]);
  });
});
