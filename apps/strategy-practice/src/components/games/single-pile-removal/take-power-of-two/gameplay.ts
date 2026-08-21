import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { range, random } from 'lodash';

export const generateStartBoard = () => {
  if (random(0, 1)) {
    return random(10, 99) * 3;
  } else {
    return random(10, 99) * 3 + random(1, 2);
  }
};

export type Board = number

export const generateTestStartBoard = () => {
  if (random(0, 1)) {
    return random(1, 9) * 3;
  } else {
    return random(1, 9) * 3 + random(1, 2);
  }
};

export const getAvailableExponents = (num: Board) => {
  if (num === 0) return [];
  const baseLog = Math.log(num) / Math.log(2);
  const maxExponent = Math.floor(baseLog);
  return range(0, maxExponent + 1);
}

export const moves = {
  subtractPowerOfTwo: {
    // A power of 2 may be subtracted only if it does not exceed the number —
    // exactly the exponents the board already offers.
    validate: (board: Board, _, exponent: number) => getAvailableExponents(board).includes(exponent),
    apply: (board: Board, { ctx }: { ctx: Ctx }, exponent: number): MoveOutcome<Board> => {
      const nextBoard = board - 2 ** exponent;
      if (nextBoard === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
