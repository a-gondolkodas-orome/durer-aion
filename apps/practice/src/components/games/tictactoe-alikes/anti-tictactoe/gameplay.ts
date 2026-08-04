import type { MoveOutcome, Ctx } from '../../../strategy-game-factory';
import { some, range, groupBy, cloneDeep } from 'lodash';
import { hasWinningSubset, type Board, validatePlacement } from '../gameplay';

export type { Board };

export const roleColors = ['red', 'blue'];

export const isGameEnd = (board: Board) => {
  if (board.filter(c => c).length === 9) return true;
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

export const hasFirstPlayerWon = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  if (board.filter(c => c).length === 9) {
    return !hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[0]));
  }
  return board.filter(c => c).length % 2 === 0;
};

export const moves = {
  placePiece: {
    validate: validatePlacement,
    apply: (board: Board, { ctx }: { ctx: Ctx }, id: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[id] = ctx.currentPlayer === 0 ? 'red' : 'blue';
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
