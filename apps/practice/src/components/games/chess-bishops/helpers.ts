import { flatMap, range } from 'lodash';

export const BISHOP = 1 as const;
export const FORBIDDEN = 2 as const;

export type CellValue = null | typeof BISHOP | typeof FORBIDDEN;
export type Board = CellValue[][];
export type Field = { row: number; col: number };

export const generateStartBoard = (): Board => {
  return range(0, 8).map(() => range(0, 8).map(() => null));
};

export const boardIndices: Field[] = flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })));

export const getAllowedMoves = (board: Board): Field[] => {
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

export const markForbiddenFields = (board: Board, { row, col }: Field): void => {
  range(0, 8).forEach(i => {
    if (row - i >= 0 && col - i >= 0) {
      board[(row - i)][col - i] = FORBIDDEN;
    }
    if (row + i <= 7 && col + i <= 7) {
      board[(row + i)][col + i] = FORBIDDEN;
    }
    if (row + i <= 7 && col - i >= 0) {
      board[(row + i)][col - i] = FORBIDDEN;
    }
    if (row - i >= 0 && col + i <= 7) {
      board[(row - i)][col + i] = FORBIDDEN;
    }
  });
};
