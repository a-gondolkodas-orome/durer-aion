import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { range, random, some, isEqual, cloneDeep } from 'lodash';

export type CellValue = null | 'knight' | 'visited';
export type Field = { row: number; col: number };
export type Board = { chessBoard: CellValue[][]; knightPosition: Field };

export const generateStartBoard = (): Board => {
  const board = range(0, 4).map(() => range(0, 4).map((): CellValue => null));
  const initialPosition: Field = { row: random(0, 3), col: random(0, 3) };
  board[initialPosition.row][initialPosition.col] = 'knight';
  return {
    chessBoard: board,
    knightPosition: initialPosition
  };
};

export const getAllowedMoves = (board: Board): Field[] => {
  const { row, col } = board.knightPosition;

  const allowedMoves: Field[] = [];
  allowedMoves.push({ row: row - 1, col: col - 2 });
  allowedMoves.push({ row: row - 1, col: col + 2 });
  allowedMoves.push({ row: row + 1, col: col - 2 });
  allowedMoves.push({ row: row + 1, col: col + 2 });
  allowedMoves.push({ row: row - 2, col: col - 1 });
  allowedMoves.push({ row: row - 2, col: col + 1 });
  allowedMoves.push({ row: row + 2, col: col - 1 });
  allowedMoves.push({ row: row + 2, col: col + 1 });
  return allowedMoves.filter(
    ({ row, col }) => row >= 0 && row <= 3 && col >= 0 && col <= 3
  ).filter(({ row, col }) => board.chessBoard[row][col] !== 'visited');
};

export const markVisitedFields = (board: Board, knightPosition: Field): void => {
  board.chessBoard[knightPosition.row][knightPosition.col] = 'visited';
};

export const moves = {
  moveKnight: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Field): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      markVisitedFields(nextBoard, nextBoard.knightPosition);

      nextBoard.chessBoard[row][col] = 'knight';
      nextBoard.knightPosition = { row, col };

      if (getAllowedMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
