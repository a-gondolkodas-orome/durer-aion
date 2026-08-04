import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = ('rock' | 'paper' | 'scissor' | null)[][]

const isGameEnd = (board: Board) => {
  const remaining = (row: Board[number]) => row.filter(symbol => symbol !== null).length;
  return remaining(board[0]) === 1 && remaining(board[1]) === 1;
};

const getWinnerIndex = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  const pairs = [[0, 2], [1, 0], [2, 1]];
  for (const p of pairs) {
    if (board[0][p[0]] !== null && board[1][p[1]]) {
      return 0;
    }
  }
  return 1;
};

// Only a symbol the other player still holds may be taken away.
export const isRemovalAllowed = (board: Board, opponent: number, idx: number): boolean =>
  Number.isInteger(idx) && idx >= 0 && idx < board[opponent].length && board[opponent][idx] !== null;

export const moves = {
  removeSymbol: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, idx: number) =>
      isRemovalAllowed(board, 1 - ctx.currentPlayer!, idx),
    apply: (board: Board, { ctx }: { ctx: Ctx }, idx: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[1 - ctx.currentPlayer!][idx] = null;
      // getWinnerIndex is undefined exactly while the game is still running.
      const winnerIndex = getWinnerIndex(nextBoard);
      if (winnerIndex !== undefined) {
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
