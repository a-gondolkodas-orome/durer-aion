import { flatMap, range, cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

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

// A duck goes on a field that is still free — neither holding a duck nor
// attacked by one. Both players place on the same board, so whose turn it is
// does not enter into legality.
export const isPlacementAllowed = (board: Board, field: Field): boolean =>
  !!field && board[field.row]?.[field.col] === null;

// The board transform a placement performs, with no turn or game consequences.
// Shared by the move and by the bot's lookahead search, which wants the next
// board and nothing else.
export const withDuckPlaced = (board: Board, { row, col }: Field): Board => {
  const nextBoard = cloneDeep(board);
  nextBoard[row][col] = DUCK;
  markForbiddenFields(nextBoard, { row, col });
  return nextBoard;
};

export const moves = {
  placeDuck: {
    validate: (board: Board, _, field: Field) => isPlacementAllowed(board, field),
    apply: (board: Board, { ctx }: { ctx: Ctx }, field: Field): MoveOutcome<Board> => {
      const nextBoard = withDuckPlaced(board, field);
      if (getAllowedMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

