import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { range, sample } from 'lodash';

export type Board = number

const minStart = 30;
export const maxStart = 80;

export const validSteps = new Set(
  [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79]
);

export const isValidStep = (d: number): boolean => validSteps.has(d);

export const isMoveValid = (board: Board, target: number): boolean => {
  if (target < 0 || target >= board) return false;
  return isValidStep(board - target);
};

export const moves = {
  moveTo: {
    validate: (board: Board, _, target: number) => isMoveValid(board, target),
    apply: (_board: Board, { ctx }: { ctx: Ctx }, target: number): MoveOutcome<Board> => {
      if (target === 0) {
        return { nextBoard: target, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard: target, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const generateStartBoard = (): Board => {
  const positions = range(minStart, maxStart + 1);
  const pPositions = positions.filter(n => n % 4 === 0);
  const nPositions = positions.filter(n => n % 4 !== 0);
  const pool = Math.random() < 0.5 ? pPositions : nPositions;
  return sample(pool)!;
};
