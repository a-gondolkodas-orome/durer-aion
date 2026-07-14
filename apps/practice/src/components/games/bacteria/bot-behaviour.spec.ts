import { reverse } from "lodash";
import { type Board, deficiency, removeOne } from "./danger";
import { attackerMove, defenderMove, legalAttackMoves } from "./bot-strategy";

// Readable behavioural checks that live ALONGSIDE bot-strategy.spec.ts (the
// brute-force optimality solver + full-game simulations). The solver proves the
// bot never blunders, but it treats every optimal move as interchangeable and
// fails with an opaque "bot blundered from X to Y". These cases instead pin the
// *specific* move the bot picks in a handful of hand-built positions, so a
// regression in move selection (wrong bacterium, wrong move type) produces a
// readable failure and the intended behaviour stays documented.
//
// Boards use lodash `reverse` so the literal reads top-row-first while the
// engine indexes rows from the bottom (row 0 = start row, last row = goals).
// A position is defender-winning exactly when deficiency === 0.

describe("bacteria bot behaviour", () => {
  describe("defenderMove", () => {
    it("removes the only bacterium that keeps the position safe when winning", () => {
      // deficiency 0: the defender is winning and has exactly one safe removal —
      // the advanced threat on the top row. Taking anything else would let the
      // attacker through, so this choice is forced.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
           [0, 0, 0, 0],
          [0, 0, 0, 0, 1],
           [0, 0, 1, 0],
          [0, 0, 0, 0]
        ]),
        goals: [2, 3, 4]
      };
      expect(deficiency(board)).toBe(0);
      const move = defenderMove(board);
      expect(move).toEqual({ row: 2, col: 4 });
      // the removal it chose must keep the defender winning
      expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
    });

    it("accepts any safe removal when several keep the position winning", () => {
      // deficiency 0 with more than one safe removal: the defender samples among
      // them, so we assert the *property* (the chosen removal stays winning)
      // rather than a single hard-coded cell — pinning one would be over-specified.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
            [0, 0, 0, 0],
          [1, 0, 0, 1, 0]
        ]),
        goals: [2]
      };
      expect(deficiency(board)).toBe(0);
      for (let i = 0; i < 40; i++) {
        const move = defenderMove(board);
        expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
      }
    });

    it("removes the advanced threat that restores a safe position", () => {
      // The board is momentarily unsafe (deficiency 1), but removing the
      // bacterium already up on the goal row brings it back to safe — and that
      // is the single removal the defender must find. Taking the far bacterium
      // on the start row would lose.
      const board: Board = {
        bacteria: reverse([[1, 0, 0], [0, 0], [0, 0, 1]]),
        goals: [1]
      };
      expect(deficiency(board)).toBe(1);
      const move = defenderMove(board);
      expect(move).toEqual({ row: 2, col: 0 });
      expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
    });
  });

  describe("attackerMove", () => {
    it("spreads to advance a dangerous bacterium when winning", () => {
      // deficiency 2: the attacker is winning and grows its dangerous bacterium
      // upward with a spread rather than a lateral shift.
      const board: Board = {
        bacteria: reverse([
          [1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1, 0],
          [0, 0, 0, 1, 0, 0, 0]
        ]),
        goals: [2, 3, 4]
      };
      expect(deficiency(board)).toBeGreaterThanOrEqual(1);
      expect(attackerMove(board)).toEqual({ type: "spread", row: 0, col: 3 });
    });

    it("attacks the closest dangerous bacterium", () => {
      // Among several threats the attacker advances the one already highest up
      // the board (row 3), not a lower one.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
            [0, 1, 0, 0],
          [0, 1, 0, 1, 0],
            [0, 1, 1, 0],
          [0, 0, 1, 0, 0]
        ]),
        goals: [1, 2, 3]
      };
      const move = attackerMove(board);
      expect([move.row, move.col]).toEqual([3, 1]);
    });

    it("still returns a legal move from a losing position", () => {
      // deficiency 0: the attacker has already lost, but must never crash or
      // return an illegal move — it plays on with some legal move.
      const board: Board = {
        bacteria: reverse([[0, 0, 0], [0, 0], [0, 0, 1]]),
        goals: [1]
      };
      expect(deficiency(board)).toBe(0);
      expect(legalAttackMoves(board)).toContainEqual(attackerMove(board));
    });
  });
});
