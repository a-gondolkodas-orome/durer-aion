import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { range, cloneDeep } from 'lodash';

export const [ALLOWED, COLORED, FORBIDDEN] = [1 as const, 2 as const, 3 as const];
export type Board = (typeof ALLOWED | typeof COLORED | typeof FORBIDDEN)[]

export const triangles = [
  { id: 0, v: [0, 1, 2], neighbors: [2] },
  { id: 1, v: [1, 3, 4], neighbors: [2, 5] },
  { id: 2, v: [1, 2, 4], neighbors: [0, 1, 3] },
  { id: 3, v: [2, 4, 5], neighbors: [2, 7] },
  { id: 4, v: [3, 6, 7], neighbors: [5, 10] },
  { id: 5, v: [3, 4, 7], neighbors: [1, 4, 6] },
  { id: 6, v: [4, 7, 8], neighbors: [5, 7, 12] },
  { id: 7, v: [4, 5, 8], neighbors: [3, 6, 8] },
  { id: 8, v: [5, 8, 9], neighbors: [7, 14] },
  { id: 9, v: [6, 10, 11], neighbors: [10] },
  { id: 10, v: [6, 7, 11], neighbors: [4, 9, 11] },
  { id: 11, v: [7, 11, 12], neighbors: [10, 12] },
  { id: 12, v: [7, 8, 12], neighbors: [6, 11, 13] },
  { id: 13, v: [8, 12, 13], neighbors: [12, 14] },
  { id: 14, v: [8, 9, 13], neighbors: [8, 13, 15] },
  { id: 15, v: [9, 13, 14], neighbors: [14] }
];

// A triangle may be coloured while it is still ALLOWED — neither coloured
// already nor forbidden by a neighbour someone coloured earlier. Both players
// colour from the same board, so whose turn it is does not enter into legality.
export const isColoringAllowed = (board: Board, id: number): boolean =>
  Number.isInteger(id) && id >= 0 && id < triangles.length && board[id] === ALLOWED;

// The board transform a colouring performs, with no turn or game consequences.
// Shared by the move and by the lookahead search below, which wants the next
// board and nothing else.
export const withTriangleColored = (board: Board, id: number): Board => {
  const nextBoard = cloneDeep(board);
  nextBoard[id] = COLORED;
  triangles[id].neighbors.forEach(n => {
    nextBoard[n] = FORBIDDEN;
  });
  return nextBoard;
};

export const moves = {
  colorTriangle: {
    validate: (board: Board, _, id: number) => isColoringAllowed(board, id),
    apply: (board: Board, { ctx }: { ctx: Ctx }, id: number): MoveOutcome<Board> => {
      const nextBoard = withTriangleColored(board, id);
      if (getAllowedMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const getAllowedMoves = (board: Board) => range(16).filter(i => board[i] === ALLOWED);
