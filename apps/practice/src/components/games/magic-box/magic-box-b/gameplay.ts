import type { MoveOutcome, Ctx } from 'strategy-game-factory';

export type Board = { stones: boolean[]; pendingLine: number | null }

/*
board indices topography
[0, 1, 2,
 3, 4, 5,
 6, 7, 8]
*/

export const generateEmptyBoard = (): Board => ({ stones: Array(9).fill(false), pendingLine: null });

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8]
];

export const isLineFull = (stones: boolean[], lineIndex: number) => LINES[lineIndex].every(i => stones[i]);

export const emptyCellsInLine = (stones: boolean[], lineIndex: number) => LINES[lineIndex].filter(i => !stones[i]);

export const placeStoneAt = (stones: boolean[], cellId: number): boolean[] =>
  [...stones.slice(0, cellId), true, ...stones.slice(cellId + 1)];

// The two halves of a turn alternate through `pendingLine`, which the board
// itself carries — a designated line is waiting for a stone, and only once that
// stone is placed may the next line be designated. So neither half needs turn
// state to know whether it is its moment.
export const isPlacementAllowed = (board: Board, cellId: number): boolean =>
  board.pendingLine !== null
    && LINES[board.pendingLine].includes(cellId)
    && !board.stones[cellId];

const isDesignationAllowed = (board: Board, lineIndex: number): boolean =>
  board.pendingLine === null
    && Number.isInteger(lineIndex)
    && lineIndex >= 0
    && lineIndex < LINES.length;

export const moves = {
  placeStone: {
    validate: (board: Board, _, cellId: number) => isPlacementAllowed(board, cellId),
    // First half of the turn: place a stone, then designate a line — the turn
    // stays open in between.
    apply: (board: Board, _, cellId: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: placeStoneAt(board.stones, cellId), pendingLine: null };
      return { nextBoard };
    }
  },

  designateLine: {
    validate: (board: Board, _, lineIndex: number) => isDesignationAllowed(board, lineIndex),
    apply: (board: Board, { ctx }: { ctx: Ctx }, lineIndex: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: board.stones, pendingLine: lineIndex };
      // A full designated line leaves the other player nowhere to place.
      if (isLineFull(nextBoard.stones, lineIndex)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
