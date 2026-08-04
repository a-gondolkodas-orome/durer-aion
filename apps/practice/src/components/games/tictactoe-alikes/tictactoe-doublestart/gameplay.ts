import type { MoveOutcome, Ctx } from '../../../strategy-game-factory';
import { range, cloneDeep } from 'lodash';
import { hasWinningSubset, type Board, validatePlacement } from '../gameplay';

export type { Board };

export const roleColors = ['red', 'blue'];

export const hasFirstPlayerWon = (board: Board) => {
  if (!isGameEnd(board)) return undefined;

  return hasWinningSubsetForPlayer(board, 0) && !hasWinningSubsetForPlayer(board, 1);
};

export const isGameEnd = (board: Board) =>
  board.filter(c => c).length === 9 || hasWinningSubsetForPlayer(board, 1);

const hasWinningSubsetForPlayer = (board: Board, roleIndex: number) =>
  hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[roleIndex]));

export const isDuringFirstMove = (board: Board) => board.filter(c => c).length <= 1;

export const moves = {
  placePiece: {
    validate: validatePlacement,
    apply: (board: Board, { ctx }: { ctx: Ctx }, id: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[id] = ctx.currentPlayer === 0 ? 'red' : 'blue';

      // The opening turn places two pieces, so the first of them leaves the
      // turn open: no isTurnEnd, and no game-end check either.
      if (isDuringFirstMove(nextBoard)) {
        return { nextBoard };
      }
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
