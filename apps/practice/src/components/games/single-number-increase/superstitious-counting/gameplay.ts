import { range, sample, difference } from 'lodash';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';

export type Board = { current: number, target: number, restricted: number | null }

// A step adds a positive whole number below 13, and superstition forbids the one
// that would complete 13 together with the previous player's step.
export const isStepAllowed = (board: Board, step: number): boolean =>
  Number.isInteger(step) && step > 0 && step < 13 && step !== board.restricted;

export const generateStartBoard = (): Board => {
  const losingPositions = range(29, 127, 14);
  const winningPositions = difference(range(26, 115), losingPositions);
  const target = sample([sample(losingPositions), sample(winningPositions)])!;
  return { current: 0, target, restricted: null };
};

export const generateTestStartBoard = (): Board => {
  const losingPositions = [29];
  const winningPositions = difference(range(26, 33), losingPositions);
  const target = sample([sample(losingPositions), sample(winningPositions)])!;
  return { current: 0, target, restricted: null };
};

export const moves = {
  step: {
    validate: (board: Board, _, step: number) => isStepAllowed(board, step),
    apply: (board: Board, { ctx }: { ctx: Ctx }, step): MoveOutcome<Board> => {
      const numberAfterStep = board.current + step;
      const nextBoard = { current: numberAfterStep, target: board.target, restricted: 13 - step };
      if (numberAfterStep >= board.target) {
        return { nextBoard, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
