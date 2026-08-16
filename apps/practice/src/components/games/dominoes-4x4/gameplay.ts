import { range, cloneDeep, isEqual, flatMap } from 'lodash';
import type { MoveOutcome, Ctx } from 'strategy-game-factory';

export type Field = { row: number, col: number }
export type Domino = [Field, Field]
export type Board = Domino[]

export const BOARDSIZE = 4;
const ALL_FIELDS: Field[] = flatMap(range(BOARDSIZE), row => range(BOARDSIZE).map(col => ({ row, col })));
export const isCovered = (field: Field, board: Board) => flatMap(board).some(c => isEqual(c, field));

// Player 0 (Árgyélus) places vertical dominoes; player 1 (Félix) horizontal ones.
export const getPossibleMoves = (board: Board, player: number): Board => {
  const possibleMoves: Board = [];
  const [dRow, dCol] = player === 0 ? [1, 0] : [0, 1];
  ALL_FIELDS.forEach(({ row, col }) => {
    const neighbor = { row: row + dRow, col: col + dCol };
    if (neighbor.row >= BOARDSIZE || neighbor.col >= BOARDSIZE) return;
    if (isCovered({ row, col }, board) || isCovered(neighbor, board)) return;
    possibleMoves.push([{ row, col }, neighbor]);
  });
  return possibleMoves;
};

// A domino is legal when it covers two uncovered fields along the current
// player's own axis, which is what `getPossibleMoves` enumerates for them. The
// player picks the two fields in either order, so the pair is matched unordered.
const isDominoAllowed = (board: Board, player: number, domino: Domino): boolean =>
  Array.isArray(domino) && domino.length === 2
    && getPossibleMoves(board, player)
      .some(m => isEqual(m, domino) || isEqual(m, [domino[1], domino[0]]));

export const moves = {
  placeDomino: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, domino: Domino) =>
      isDominoAllowed(board, ctx.currentPlayer!, domino),
    apply: (board: Board, { ctx }: { ctx: Ctx }, domino: Domino): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.push(domino);
      const nextPlayer = 1 - ctx.currentPlayer!;
      if (getPossibleMoves(nextBoard, nextPlayer).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
