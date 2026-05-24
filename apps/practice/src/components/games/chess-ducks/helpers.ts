import { flatMap, range, cloneDeep } from "lodash";
import type { Events } from "../../game-factory/types";

export const DUCK = 1 as const;
export const FORBIDDEN = 2 as const;

export type CellValue = null | typeof DUCK | typeof FORBIDDEN;
export type Board = CellValue[][];
export type Field = { row: number; col: number };

export const getBoardIndices = (rows: number, cols: number): Field[] =>
  flatMap(range(0, rows), row => range(0, cols).map(col => ({ row, col })));

export const getAllowedMoves = (board: Board): Field[] => {
  const boardIndices = getBoardIndices(board.length, board[0].length);
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

export const markForbiddenFields = (board: Board, { row, col }: Field): void => {
  const rows = board.length;
  const cols = board[0].length;
  if (row - 1 >= 0) {
    board[(row - 1)][col] = FORBIDDEN;
  }
  if (row + 1 <= (rows - 1)) {
    board[(row + 1)][col] = FORBIDDEN;
  }
  if (col - 1 >= 0) {
    board[(row)][col - 1] = FORBIDDEN;
  }
  if (col + 1 <= (cols - 1)) {
    board[(row)][col + 1] = FORBIDDEN;
  }
};

export const moves = {
  placeDuck: (board: Board, { events }: { events: Events }, { row, col }: Field) => {
    const nextBoard = cloneDeep(board);
    nextBoard[row][col] = DUCK;
    markForbiddenFields(nextBoard, { row, col });
    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};
