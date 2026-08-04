import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { range, cloneDeep, sample, random } from 'lodash';

export type Board = { numbersOnTable: boolean[], previousMove: number | null }

// The number must still be on the table, and — from the second move on — be a
// divisor or a multiple of the number the other player just removed. The
// on-the-table check used to be skipped for the opening move, where every
// number is still there anyway; hoisting it above the previousMove branch
// changes nothing for a real opening move but keeps a bogus argument out.
export const isAllowed = (board: Board, n: number) => {
  if (!Number.isInteger(n) || n < 1 || n > board.numbersOnTable.length) return false;
  if (board.numbersOnTable[n - 1] === false) return false;
  if (board.previousMove === null) {
    return true;
  }
  if (board.previousMove > n && board.previousMove % n === 0) {
    return true;
  } else if (board.previousMove < n && n % board.previousMove === 0) {
    return true;
  }
  return false;
}

export const moves = {
  removeNumber: {
    validate: (board: Board, _, n: number) => isAllowed(board, n),
    apply: (board: Board, { ctx }: { ctx: Ctx }, n: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.numbersOnTable[n - 1] = false;
      nextBoard.previousMove = n;
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const isGameEnd = (board: Board) => {
  const possibleMoves = range(1, board.numbersOnTable.length + 1)
    .filter(n => isAllowed(board, n));
  return possibleMoves.length === 0;
}

export const generateStartBoard = (): Board => {
  const numCount = random(0, 2) === 0
    ? sample([6, 10])!
    : sample([7, 8, 9, 11, 12, 13, 14, 15])!;
  return ({
    numbersOnTable: Array(numCount).fill(true),
    previousMove: null
  })
}

export const generateTestStartBoard = (): Board => {
  const numCount = random(0, 2) === 0
    ? sample([6])!
    : sample([7, 8, 9])!;
  return ({
    numbersOnTable: Array(numCount).fill(true),
    previousMove: null
  })
}
