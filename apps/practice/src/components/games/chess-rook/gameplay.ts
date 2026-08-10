import { cloneDeep, isEqual, range, some } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type CellValue = null | 'rook' | 'visited';
export type Field = { row: number; col: number };
export type Board = { chessBoard: CellValue[][]; rookPosition: Field };

export const startBoard: Board = {
chessBoard: range(0, 8).map(row =>
  range(0, 8).map((col): CellValue => (row === 0 && col === 0 ? 'rook' : null))),
rookPosition: { row: 0, col: 0 }
};

export const getAllowedMoves = (board: Board): Field[] => {
  const { row, col } = board.rookPosition;

  const allowedMoves: Field[] = [];
  let i = 1;
  while (row - i >= 0 && board.chessBoard[(row - i)][col] === null) {
    allowedMoves.push({ row: row - i, col });
    i += 1;
  }
  i = 1;
  while (row + i <= 7 && board.chessBoard[(row + i)][col] === null) {
    allowedMoves.push({ row: row + i, col });
    i += 1;
  }
  i = 1;
  while (col - i >= 0 && board.chessBoard[row][col - i] === null) {
    allowedMoves.push({ row, col: col - i });
    i += 1;
  }
  i = 1;
  while (col + i <= 7 && board.chessBoard[row][col + i] === null) {
    allowedMoves.push({ row, col: col + i });
    i += 1;
  }
  return allowedMoves;
};

export const moves = {
  moveRook: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Field): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      markVisitedFields(nextBoard, nextBoard.rookPosition, { row, col });

      nextBoard.chessBoard[row][col] = 'rook';
      nextBoard.rookPosition = { row, col };

      if (getAllowedMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const markVisitedFields = (board: Board, rookPosition: Field, nextRookPosition: Field): void => {
  if (rookPosition.row === nextRookPosition.row) {
    range(rookPosition.col, nextRookPosition.col).forEach(col => {
      board.chessBoard[rookPosition.row][col] = 'visited';
    });
  }
  if (rookPosition.col === nextRookPosition.col) {
    range(rookPosition.row, nextRookPosition.row).forEach(row => {
      board.chessBoard[row][rookPosition.col] = 'visited';
    });
  }
};
