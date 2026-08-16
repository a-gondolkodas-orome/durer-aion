import { range, cloneDeep, isEqual, flatMap } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Field = { row: number, col: number }
export type Domino = [Field, Field]
export type Board = Domino[]

export const BOARDSIZE = 6;
export const ALL_FIELDS: Field[] = flatMap(range(BOARDSIZE), row => range(BOARDSIZE).map(col => ({ row, col })));
export const isCovered = (field: Field, board: Board) => flatMap(board).some(c => isEqual(c, field));

export const getPossibleMoves = (board: Board) => {
  const possibleMoves: Board = [];
  ALL_FIELDS.forEach(({ row, col }) => {
    if (isCovered({ row, col }, board)) return;
    if (col < (BOARDSIZE - 1) && !isCovered({ row, col: col + 1 }, board)) {
      possibleMoves.push([{ row, col }, { row, col: col + 1 }])
    };
    if (row < (BOARDSIZE - 1) && !isCovered({ row: row + 1, col }, board)) {
      possibleMoves.push([{ row, col }, { row: row + 1, col }])
    };
  });

  return possibleMoves;
}

// A domino is legal when it covers two uncovered neighbouring fields, which is
// what `getPossibleMoves` enumerates. The player picks the two fields in either
// order, so the pair is matched unordered.
const isDominoAllowed = (board: Board, domino: Domino): boolean =>
  Array.isArray(domino) && domino.length === 2
    && getPossibleMoves(board).some(m => isEqual(m, domino) || isEqual(m, [domino[1], domino[0]]));

export const moves = {
  placeDomino: {
    validate: (board: Board, _, domino: Domino) => isDominoAllowed(board, domino),
    apply: (board: Board, { ctx }: { ctx: Ctx }, domino: Domino): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.push(domino);
      if (getPossibleMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
