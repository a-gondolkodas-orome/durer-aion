import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { random } from 'lodash';

export type Board = number[]

export const moves = {
  add1: {
    apply: (board: Board): MoveOutcome<Board> =>
      ({ nextBoard: [board[0], board[1] + 1], isTurnEnd: true })
  },
  subtract: {
    apply: (board: Board, { ctx }: { ctx: Ctx }): MoveOutcome<Board> => {
      const nextBoard = [board[0] - board[1], board[1]];
      if (board[0] - board[1] <= 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const generateTestStartBoard = () => {
  const b = random(2, 5);
  const a = b + random(1, b);
  return [a, b];
};

export const generateStartBoard = () => {
  if (random(0, 2) === 0) {
    const b = random(8, 15);
    const a = b + random(1, b);
    return [a, b];
  }
  if (random(0, 1) === 0) {
    const r = random(0, 2);
    if (r === 0) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    } else if (r === 1) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2 + 1;
      return [a, b];
    } else if (r === 2) {
      const b = random(5, 9) * 2;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    }
  } else {
    const b = random(5, 9) * 2;
    const a = b * (2 + random(0, 3)) + random(0, Math.floor((b - 1)/2)) * 2 + 1;
    return [a, b];
  }

  return [random(15, 25), random(10, 15)];
}
