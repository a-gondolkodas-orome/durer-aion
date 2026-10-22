import { describe, test, expect } from "vitest";
import { Client } from "boardgame.io/client";
import { GameRelay, RelayWrapper, relayProblemResults } from "./game";

// Regression: the first problem's max points came hardcoded as 3 (setup) and the
// firstProblem move dropped the value the strategy sent, so a problem set whose
// first problem is worth 2 points scored 3 for it.
describe("GameRelay first problem points", () => {
  test("firstProblem sets the first problem's points and keeps every problem's for the end tables", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first problem text", [2, 3], "");

    expect(client.getState()?.G.currentProblemAvailablePoints).toStrictEqual(2);
    expect(client.getState()?.G.maxPointsList).toStrictEqual([2, 3]);
  });

  test("a first-try correct answer scores the problem's own points, and the next problem is worth its own", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first problem text", [2, 3], "");
    client.moves.submitAnswer(120);
    client.moves.newProblem("second problem text", true, "");

    expect(client.getState()?.G.points).toStrictEqual(2);
    expect(client.getState()?.G.previousPoints[0]).toStrictEqual(2);
    expect(client.getState()?.G.currentProblemAvailablePoints).toStrictEqual(3);
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
    client.moves.firstProblem("first problem text", [2, 3], "");
    client.moves.submitAnswer(120);
    client.moves.endGame(true);

    expect(client.getState()?.ctx.gameover).toBeDefined();
    const endReports = reports.filter((report) => report.phase === "end");
    expect(endReports).toStrictEqual([{ phase: "end", points: 2 }]);
  });
});

// Regression: every clock poll of the countdown sent a step report too.
describe("RelayWrapper step report", () => {
  test("only a submitted answer is reported, not a clock poll", () => {
    const steps: number[] = [];
    const client = Client({
      game: RelayWrapper((report) => {
        if (report.phase === "step") {
          steps.push(report.answer);
        }
      }),
      numPlayers: 2,
    });
    client.start();
    client.moves.startGame();
    client.moves.firstProblem("first problem text", [2, 3], "");

    client.moves.getTime();
    client.moves.submitAnswer(120);
    client.moves.nextTry(1);
    client.moves.submitAnswer(7);
    client.moves.newProblem("second problem text", true, "");
    client.moves.getTime();

    expect(steps).toStrictEqual([120, 7]);
  });
});

describe("relayProblemResults", () => {
  test("tells a problem failed three times from one never answered, though both score 0", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    client.moves.startGame();
    client.moves.firstProblem("first", [4, 3, 5], "");
    client.moves.submitAnswer(1);
    client.moves.nextTry(3);
    client.moves.submitAnswer(2);
    client.moves.newProblem("second", true, "");
    for (const lowered of [2, 1]) {
      client.moves.submitAnswer(lowered);
      client.moves.nextTry(lowered);
    }
    client.moves.submitAnswer(3);
    client.moves.newProblem("third", false, "");

    const G = client.getState()?.G;
    expect(G && relayProblemResults(G).map(({ maxPoints, points, trySeconds }) => [maxPoints, points, trySeconds.length]))
      .toStrictEqual([[4, 3, 2], [3, 0, 3], [5, 0, 0]]);
  });

  test("times each problem from when it appeared, and each try from the one before", () => {
    const answer = (answer: number, date: string) => ({ answer, date });
    const G = {
      start: "2026-10-10T10:00:00Z",
      maxPointsList: [3, 4, 5],
      previousPoints: [2, 0],
      previousAnswers: [
        [answer(1, "2026-10-10T10:03:00Z"), answer(2, "2026-10-10T10:04:30Z")],
        [answer(7, "2026-10-10T10:05:00Z"), answer(8, "2026-10-10T10:06:00Z"), answer(9, "2026-10-10T10:06:05Z")],
        [],
      ],
    };

    expect(relayProblemResults(G)).toStrictEqual([
      { maxPoints: 3, points: 2, trySeconds: [180, 90] },
      { maxPoints: 4, points: 0, trySeconds: [30, 60, 5] },
      { maxPoints: 5, points: 0, trySeconds: [] },
    ]);
  });
});
