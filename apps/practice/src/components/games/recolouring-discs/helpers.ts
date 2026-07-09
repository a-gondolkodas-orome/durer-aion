// Recolouring discs — core game logic.
//
// A row of `n` fields. Field 0 starts with a red disc, field n-1 with a blue
// disc. Player 0 (red) moves first, player 1 (blue) second. On a turn a player
// either moves one own disc 1–2 fields into an empty cell (may jump over a
// disc), places a new own disc on an empty cell adjacent to one of their own
// discs, or passes. Whenever a disc *enters* an empty cell, every
// opposite-coloured disc in an adjacent cell flips to the mover's colour.
//
// Red wins the instant red has strictly more than n/2 discs; blue wins the
// instant blue has at least n/2 discs; if neither happens within 200 plies,
// blue wins.

import { range, sample } from 'lodash';

export type Cell = 'red' | 'blue' | null;
export type Board = { cells: Cell[] };

export const RED = 0;
export const BLUE = 1;

export const colorOf = (player: number): 'red' | 'blue' => (player === RED ? 'red' : 'blue');
export const opponentColor = (color: 'red' | 'blue'): 'red' | 'blue' => (color === 'red' ? 'blue' : 'red');

export type Move =
  | { type: 'move'; from: number; to: number }
  | { type: 'place'; to: number }
  | { type: 'pass' };

// Compact string key for a cell array, used by the solver.
export const encode = (cells: Cell[]): string =>
  cells.map(c => (c === 'red' ? 'R' : c === 'blue' ? 'B' : '.')).join('');

export const countColor = (cells: Cell[], color: 'red' | 'blue'): number =>
  cells.filter(c => c === color).length;

// The player (0 or 1) who has already won in this position, or null if neither.
// Red needs strictly more than n/2; blue needs at least n/2. These cannot both
// hold at once (that would need more than n discs on the board).
export const majorityWinner = (cells: Cell[]): number | null => {
  const n = cells.length;
  if (countColor(cells, 'red') * 2 > n) return RED;
  if (countColor(cells, 'blue') * 2 >= n) return BLUE;
  return null;
};

// Recolour in place: a disc of `color` has just entered cell `j`; flip every
// opposite-coloured disc directly adjacent to `j`.
const recolourAround = (cells: Cell[], j: number, color: 'red' | 'blue'): void => {
  const other = opponentColor(color);
  for (const k of [j - 1, j + 1]) {
    if (k >= 0 && k < cells.length && cells[k] === other) cells[k] = color;
  }
};

// Destinations a disc at `from` may move to: an empty cell 1 or 2 away.
export const moveTargets = (cells: Cell[], from: number): number[] =>
  [from - 2, from - 1, from + 1, from + 2].filter(
    j => j >= 0 && j < cells.length && cells[j] === null
  );

// Empty cells where `color` may place a new disc: empty and adjacent to an own disc.
export const placeTargets = (cells: Cell[], color: 'red' | 'blue'): number[] =>
  range(cells.length).filter(
    j =>
      cells[j] === null &&
      ((j - 1 >= 0 && cells[j - 1] === color) ||
        (j + 1 < cells.length && cells[j + 1] === color))
  );

export const legalMoves = (cells: Cell[], player: number): Move[] => {
  const color = colorOf(player);
  const result: Move[] = [{ type: 'pass' }];
  cells.forEach((c, from) => {
    if (c === color) moveTargets(cells, from).forEach(to => result.push({ type: 'move', from, to }));
  });
  placeTargets(cells, color).forEach(to => result.push({ type: 'place', to }));
  return result;
};

// Apply a move for `player`, returning a fresh cell array (recolouring included).
export const applyMove = (cells: Cell[], player: number, move: Move): Cell[] => {
  const next = [...cells];
  if (move.type === 'pass') return next;
  const color = colorOf(player);
  if (move.type === 'move') next[move.from] = null;
  next[move.to] = color;
  recolourAround(next, move.to, color);
  return next;
};

// Discs each side must reach to win: red strictly more than n/2, blue at least
// n/2.
export const targetCounts = (n: number): { red: number; blue: number } => ({
  red: Math.floor(n / 2) + 1,
  blue: Math.ceil(n / 2)
});

export const startCells = (n: number): Cell[] => {
  const cells: Cell[] = range(n).map(() => null);
  cells[0] = 'red';
  cells[n - 1] = 'blue';
  return cells;
};

// Board sizes a game starts from. The first player (red) wins iff 4 does not
// divide n; the second player (blue) wins iff 4 | n. We pick the winning role
// 50/50 and then a size within it, so neither role dominates across games and
// the player — who sees the board, hence n, before choosing a side — always has
// a winnable choice. Sizes are capped at 12: the bot solves the game exactly
// (see solver.ts) and that stays instant up to n = 12, but the state space
// doubles per cell, so larger boards are not exactly solvable.
export const FIRST_PLAYER_WIN_SIZES = [7, 9, 10, 11];
export const SECOND_PLAYER_WIN_SIZES = [8, 12];
export const BOARD_SIZES = [...FIRST_PLAYER_WIN_SIZES, ...SECOND_PLAYER_WIN_SIZES];

export const generateStartBoard = (): Board => {
  const pool = sample([FIRST_PLAYER_WIN_SIZES, SECOND_PLAYER_WIN_SIZES])!;
  return { cells: startCells(sample(pool)!) };
};
