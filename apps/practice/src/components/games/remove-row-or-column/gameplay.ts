import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Grid = boolean[][]
export type Board = { grid: Grid }
export type Orientation = 'row' | 'col'
// The disc the player picked first, while choosing between its row and its column.
export type TurnState = { r: number; c: number }
interface Rect { minR: number; maxR: number; minC: number; maxC: number }
export interface Move { r: number; c: number; orientation: Orientation }

const inBounds = (grid: Grid, r: number, c: number) =>
  r >= 0 && r < grid.length && c >= 0 && c < grid[0].length;

// Flood fill (4-connectivity) from a disc, returning the bounding box of its
// connected component. Thanks to the game invariant every component is a solid
// isolated rectangle, so the bounding box equals the rectangle of discs.
export const getRectangleAt = (grid: Grid, sr: number, sc: number): Rect | null => {
  if (!grid[sr]?.[sc]) return null;
  let minR = sr, maxR = sr, minC = sc, maxC = sc;
  const seen = new Set<string>([`${sr},${sc}`]);
  const stack: Array<[number, number]> = [[sr, sc]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(grid, nr, nc) && grid[nr][nc] && !seen.has(`${nr},${nc}`)) {
        seen.add(`${nr},${nc}`);
        stack.push([nr, nc]);
      }
    }
  }
  return { minR, maxR, minC, maxC };
};

// All rectangles of discs currently on the board.
export const getRectangles = (grid: Grid): Rect[] => {
  const rects: Rect[] = [];
  const seen = new Set<string>();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] && !seen.has(`${r},${c}`)) {
        const rect = getRectangleAt(grid, r, c)!;
        for (let i = rect.minR; i <= rect.maxR; i++) {
          for (let j = rect.minC; j <= rect.maxC; j++) seen.add(`${i},${j}`);
        }
        rects.push(rect);
      }
    }
  }
  return rects;
};

export const applyMove = (grid: Grid, { r, c, orientation }: Move): Grid => {
  const rect = getRectangleAt(grid, r, c)!;
  const next = grid.map(row => row.slice());
  if (orientation === 'row') {
    for (let j = rect.minC; j <= rect.maxC; j++) next[r][j] = false;
  } else {
    for (let i = rect.minR; i <= rect.maxR; i++) next[i][c] = false;
  }
  return next;
};

export const isEmpty = (grid: Grid): boolean => grid.every(row => row.every(cell => !cell));

export const moves = {
  removeLine: {
    // A move names a disc and an orientation; the rectangle it belongs to, and
    // hence the line removed, follow from the grid. Every disc's row and column
    // are removable, so "there is a disc at (r, c)" is the whole of legality —
    // but it matters, since applyMove reads the rectangle around that disc and
    // there is none around an empty cell.
    validate: (board: Board, _: { ctx: Ctx<TurnState> }, move: Move) =>
      !!move && (move.orientation === 'row' || move.orientation === 'col')
        && board.grid[move.r]?.[move.c] === true,
    apply: (board: Board, { ctx }: { ctx: Ctx<TurnState> }, move: Move): MoveOutcome<Board, TurnState> => {
      const nextBoard = { grid: applyMove(board.grid, move) };
      // nextTurnState clears the disc the BoardClient parked in ctx.turnState
      // while the player was choosing between its row and its column.
      if (isEmpty(nextBoard.grid)) {
        return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, nextTurnState: null, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

// Every legal move: for each rectangle, one move per row and one per column.
export const getAllMoves = (grid: Grid): Move[] => {
  const moves: Move[] = [];
  for (const rect of getRectangles(grid)) {
    for (let r = rect.minR; r <= rect.maxR; r++) moves.push({ r, c: rect.minC, orientation: 'row' });
    for (let c = rect.minC; c <= rect.maxC; c++) moves.push({ r: rect.minR, c, orientation: 'col' });
  }
  return moves;
};
