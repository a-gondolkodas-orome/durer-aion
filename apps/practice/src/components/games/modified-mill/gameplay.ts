import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { range } from 'lodash';
import { LINES, COORDS } from './board-data';

// A cell is empty (null) or holds the first player's (red) / second player's
// (blue) disc. Index 0 = first player, index 1 = second player throughout.
export type Cell = 'red' | 'blue' | null;
export type Board = Cell[];

export const CELL_COUNT = COORDS.length; // 24

export const playerColor = (playerIndex: number): 'red' | 'blue' =>
  playerIndex === 0 ? 'red' : 'blue';

export const generateEmptyBoard = (): Board => Array(CELL_COUNT).fill(null);

// Bitmask of the cells occupied by each colour, for compact win / strategy logic.
const LINE_MASKS = LINES.map(([a, b, c]) => (1 << a) | (1 << b) | (1 << c));

export const linesThrough: number[][] = range(CELL_COUNT).map((node) =>
  LINE_MASKS.filter((mask) => (mask & (1 << node)) !== 0)
);

export const boardMasks = (board: Board): { red: number; blue: number } => {
  let red = 0;
  let blue = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (board[i] === 'red') red |= 1 << i;
    else if (board[i] === 'blue') blue |= 1 << i;
  }
  return { red, blue };
};

export const emptyCells = (red: number, blue: number): number[] =>
  range(CELL_COUNT).filter((node) => ((red | blue) & (1 << node)) === 0);

// Does adding `node` to `mask` complete one of the three-in-a-line sets?
export const completesLine = (mask: number, node: number): boolean => {
  const withNode = mask | (1 << node);
  return linesThrough[node].some((line) => (withNode & line) === line);
};

export const hasLine = (mask: number): boolean =>
  LINE_MASKS.some((line) => (mask & line) === line);

export const playerHasLine = (board: Board, playerIndex: number): boolean => {
  const { red, blue } = boardMasks(board);
  return hasLine(playerIndex === 0 ? red : blue);
};

export const isBoardFull = (board: Board): boolean => board.every((cell) => cell !== null);

// A disc may go on any cell of the board that is still empty; both players draw
// from the same pool of cells, so whose turn it is does not matter.
export const isPlacementAllowed = (board: Board, node: number): boolean =>
  Number.isInteger(node) && node >= 0 && node < CELL_COUNT && board[node] === null;

export const moves = {
  placePiece: {
    validate: (board: Board, _, node: number) => isPlacementAllowed(board, node),
    apply: (board: Board, { ctx }: { ctx: Ctx }, node: number): MoveOutcome<Board> => {
      const nextBoard = board.slice();
      nextBoard[node] = playerColor(ctx.currentPlayer!);
      if (playerHasLine(nextBoard, ctx.currentPlayer!)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      if (isBoardFull(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
