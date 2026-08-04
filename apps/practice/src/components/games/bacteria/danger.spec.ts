import { range } from "lodash";
import { computeLettered, deficiency } from "./danger";
import type { Board } from "./gameplay";

const emptyBoard = (rows: number, wide: number): number[][] =>
  range(rows).map(r => Array(r % 2 === 0 ? wide : wide - 1).fill(0));

describe("computeLettered", () => {
  it("builds the danger pyramid under a single goal", () => {
    // 5 rows, wide 5, goal at column 2.
    const board: Board = { bacteria: emptyBoard(5, 5), goals: [2] };
    const lettered = computeLettered(board);
    // top row: goal and its two neighbours
    expect(lettered[4]).toEqual([false, true, true, true, false]);
    // narrow row below (width 4): cells whose both spread children are lettered
    expect(lettered[3]).toEqual([false, true, true, false]);
    // two rows below the goal, straight under it: still dangerous
    expect(lettered[2][2]).toBe(true);
  });

  it("marks a wide-row edge two rows below an edge goal (jump exception)", () => {
    const board: Board = { bacteria: emptyBoard(5, 5), goals: [0] };
    const lettered = computeLettered(board);
    // (2,0) is a wide-row edge two rows below the edge goal -> a jump wins.
    expect(lettered[2][0]).toBe(true);
    // an interior wide cell two rows below cannot be forced from the edge case
    expect(lettered[2][2]).toBe(false);
  });
});

describe("deficiency as game value", () => {
  it("is 0 when a lone bacterium can be shepherded to a free cell", () => {
    const board: Board = { bacteria: emptyBoard(5, 5), goals: [2] };
    board.bacteria[0][0] = 1;
    expect(deficiency(board)).toBe(0);
  });

  it("is >= 1 when goals blanket every reachable top cell", () => {
    // From a central start on a narrow board every reachable top cell is lettered.
    const board: Board = { bacteria: emptyBoard(3, 3), goals: [0, 1, 2] };
    board.bacteria[0][1] = 1;
    expect(deficiency(board)).toBeGreaterThanOrEqual(1);
  });
});
