import { describe, test, expect } from "vitest";
import { State } from "boardgame.io";
import { MyGameState } from "game";
import { relayStrategy, Problem } from "./strategy";

const problemList: Problem[] = [
  { problemText: "first", answer: 120, points: 2 },
  { problemText: "second", answer: 384, points: 3 },
];

const stateWith = (G: Partial<MyGameState>): State<MyGameState> =>
  ({ G } as State<MyGameState>);

// Regression: the firstProblem payload carried a hardcoded 3 instead of the
// problem's own points, wrong for any set not starting with a 3-point problem.
describe("relayStrategy", () => {
  test("first problem carries its own points", () => {
    const [args, move] = relayStrategy(problemList)(
      stateWith({ numberOfTry: 0, currentProblem: 0 }),
      "1",
    );

    expect(move).toStrictEqual("firstProblem");
    expect(args).toStrictEqual(["first", 2, ""]);
  });

  test("advancing carries the next problem's points", () => {
    const [args, move] = relayStrategy(problemList)(
      stateWith({ numberOfTry: 1, currentProblem: 0, answer: 120, currentProblemMaxPoints: 2 }),
      "1",
    );

    expect(move).toStrictEqual("newProblem");
    expect(args).toStrictEqual(["second", 3, true, ""]);
  });
});
