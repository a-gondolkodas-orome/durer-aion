import type { MoveOutcome } from '../../strategy-game-factory';
import { range, sum, sample, cloneDeep } from 'lodash';

export type Board = number[]

export const COVERED = -1 as const;

export const getRemaining = (board: Board) => board.filter(i => i !== COVERED);

// Numbers are addressed by their value, which is also their 1-based position;
// only one that is still showing may be covered.
const isCoveringAllowed = (board: Board, number: number): boolean =>
  Number.isInteger(number) && number >= 1 && number <= board.length && board[number - 1] !== COVERED;

export const moves = {
  coverNumber: {
    validate: (board: Board, _, number: number) => isCoveringAllowed(board, number),
    apply: (board: Board, _, number: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[number-1] = COVERED;

      const remaining = getRemaining(nextBoard);
      if (remaining.length === 2) {
        return { nextBoard, gameEnd: { winnerIndex: sum(remaining) % 2 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;

// Test variant covers both sub-games: numbers 1–8 or 1–10.
export const generateTestStartBoard = (): Board => range(1, sample([9, 11])!);
