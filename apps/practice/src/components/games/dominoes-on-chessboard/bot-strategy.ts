import { sample, last } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import { type Board, BOARDSIZE, getPossibleMoves } from './dominoes-on-chessboard';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.placeDomino(board, sample(getPossibleMoves(board)));
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  if (ctx.chosenRoleIndex === 0) {
    // Bot plays second: mirroring the opponent's last move through the board's center
    // is unconditionally optimal on this even-sized board (no cell maps to itself), so
    // there's never a reason to search - it always wins regardless of how well the
    // first player plays.
    const lastDomino = last(board)!;
    const N = BOARDSIZE * BOARDSIZE - 1;
    moves.placeDomino(board, [N - lastDomino[0], N - lastDomino[1]]);
    return;
  }

  // Bot plays first: no unconditional winning strategy exists (this board is a proven
  // loss for the first player against perfect play), so play exactly whenever the
  // position can be solved, to capitalize on any mistakes the opponent makes; fall
  // back to a random move otherwise.
  const exactMove = getExactWinningMove(board);
  moves.placeDomino(board, exactMove ?? sample(getPossibleMoves(board)));
};

// This game (Cram) is impartial - either player may place a domino in either
// orientation - so by the Sprague-Grundy theorem, once the empty squares split into
// disconnected regions, each region is an independent subgame: solve each separately
// and combine by XOR. A region with Grundy value 0 is a loss for whoever has to move
// in it; a sum of regions is a loss for the mover iff the XOR of all their values is 0.
//
// Solving a region from scratch is still exponential in its size, so two shortcuts
// keep this fast in practice:
// - any region symmetric under a 180° rotation with no self-paired cell has Grundy 0
//   (the classic "always mirror the opponent's last move" pairing argument applies to
//   any such region, not just full rectangles - this also covers the empty starting
//   board for free).
// - regions that are neither small enough to solve outright nor caught by that
//   shortcut are left unresolved, and the bot falls back to its old heuristic for that
//   move - rather than guessing, since an unresolved region could change the outcome.
//
// Profiling (see exploration notes) showed exact solving of irregular regions costs:
// 16 cells ~45ms, 18 cells ~300ms, 20 cells ~650ms, 22 cells ~1s - so a cutoff of 16
// gives a comfortable margin while still covering nearly all real midgame fragments
// (the 6x6 board only has 36 cells total, so most fragments are well under that once
// a handful of dominoes have been placed).
const MAX_EXACTLY_SOLVABLE_REGION_SIZE = 16;

type Cell = [number, number];

const idToCell = (id: number): Cell => [Math.floor(id / BOARDSIZE), id % BOARDSIZE];
const cellToId = ([row, col]: Cell): number => row * BOARDSIZE + col;
const cellKey = ([row, col]: Cell) => `${row},${col}`;

const getEmptyCells = (board: Board): Cell[] => {
  const covered = new Set(board.flat());
  const empty: Cell[] = [];
  for (let id = 0; id < BOARDSIZE * BOARDSIZE; id++) {
    if (!covered.has(id)) empty.push(idToCell(id));
  }
  return empty;
};

const getConnectedComponents = (cells: Cell[]): Cell[][] => {
  const present = new Set(cells.map(cellKey));
  const seen = new Set<string>();
  const components: Cell[][] = [];

  for (const cell of cells) {
    if (seen.has(cellKey(cell))) continue;
    const component: Cell[] = [];
    const stack = [cell];
    seen.add(cellKey(cell));
    while (stack.length > 0) {
      const [row, col] = stack.pop()!;
      component.push([row, col]);
      for (const [dRow, dCol] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const neighbor: Cell = [row + dRow, col + dCol];
        const key = cellKey(neighbor);
        if (present.has(key) && !seen.has(key)) {
          seen.add(key);
          stack.push(neighbor);
        }
      }
    }
    components.push(component);
  }
  return components;
};

// Normalizes a region to a translation- and symmetry-independent string, so that two
// regions with the same shape (up to the square's 8 symmetries) share one memo entry.
const SQUARE_SYMMETRIES: ((cell: Cell) => Cell)[] = [
  ([row, col]) => [row, col],
  ([row, col]) => [row, -col],
  ([row, col]) => [-row, col],
  ([row, col]) => [-row, -col],
  ([row, col]) => [col, row],
  ([row, col]) => [col, -row],
  ([row, col]) => [-col, row],
  ([row, col]) => [-col, -row]
];

const normalize = (cells: Cell[]): Cell[] => {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]): Cell => [row - minRow, col - minCol])
    .sort(([r1, c1], [r2, c2]) => r1 - r2 || c1 - c2);
};

const serialize = (cells: Cell[]) => cells.map(cellKey).join(';');

const canonicalRegionKey = (cells: Cell[]): string =>
  SQUARE_SYMMETRIES
    .map(symmetry => serialize(normalize(cells.map(symmetry))))
    .sort()[0];

// Does this region map onto itself under 180° rotation about its own center, with no
// cell mapped to itself? If so its Grundy value is 0, by the standard mirroring
// argument, with no need to search it.
const isCenterSymmetricWithNoFixedCell = (cells: Cell[]): boolean => {
  const present = new Set(cells.map(cellKey));
  const minRow = Math.min(...cells.map(([row]) => row));
  const maxRow = Math.max(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  const maxCol = Math.max(...cells.map(([, col]) => col));
  const doubledCenterRow = minRow + maxRow;
  const doubledCenterCol = minCol + maxCol;

  return cells.every(([row, col]) => {
    if (row * 2 === doubledCenterRow && col * 2 === doubledCenterCol) return false;
    return present.has(cellKey([doubledCenterRow - row, doubledCenterCol - col]));
  });
};

const grundyMemo = new Map<string, number>();

const grundyOfRegion = (cells: Cell[]): number => {
  if (cells.length < 2) return 0;
  const key = canonicalRegionKey(cells);
  const cached = grundyMemo.get(key);
  if (cached !== undefined) return cached;

  const present = new Set(cells.map(cellKey));
  const reachableValues = new Set<number>();
  for (const [row, col] of cells) {
    for (const [dRow, dCol] of [[1, 0], [0, 1]]) {
      const neighbor: Cell = [row + dRow, col + dCol];
      if (!present.has(cellKey(neighbor))) continue;
      const remaining = cells.filter(
        ([r, c]) => !(r === row && c === col) && !(r === neighbor[0] && c === neighbor[1])
      );
      let xor = 0;
      for (const component of getConnectedComponents(remaining)) xor ^= grundyOfRegion(component);
      reachableValues.add(xor);
    }
  }

  let grundy = 0;
  while (reachableValues.has(grundy)) grundy++;
  grundyMemo.set(key, grundy);
  return grundy;
};

// Returns the region's Grundy value if it's cheap enough to know for sure, else
// undefined - signaling that the overall position can't be safely evaluated.
const getKnownGrundy = (cells: Cell[]): number | undefined => {
  if (cells.length <= MAX_EXACTLY_SOLVABLE_REGION_SIZE) return grundyOfRegion(cells);
  return isCenterSymmetricWithNoFixedCell(cells) ? 0 : undefined;
};

// Finds a move that wins outright, if the current position can be fully evaluated and
// is actually winning. Returns undefined if the position is unwinnable against perfect
// play, or too large/irregular to evaluate safely (the caller should fall back to its
// existing heuristic in that case, rather than risk an incorrect "exact" move).
export const getExactWinningMove = (board: Board): [number, number] | undefined => {
  const components = getConnectedComponents(getEmptyCells(board));
  const grundyValues = components.map(getKnownGrundy);
  if (grundyValues.some(value => value === undefined)) return undefined;

  const totalXor = (grundyValues as number[]).reduce((xor, value) => xor ^ value, 0);
  if (totalXor === 0) return undefined;

  // A region only needs to be searched for the adjusting move if it was solved
  // exactly (small enough to recurse into); any region resolved via the symmetry
  // shortcut always contributes 0, so it can never be the source of an imbalance and
  // never needs to be touched to fix one (Sprague-Grundy guarantees the move exists
  // among the exactly-solved regions whenever the position is winning).
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (component.length > MAX_EXACTLY_SOLVABLE_REGION_SIZE) continue;
    const otherComponentsXor = totalXor ^ grundyValues[i]!;
    const present = new Set(component.map(cellKey));

    for (const [row, col] of component) {
      for (const [dRow, dCol] of [[1, 0], [0, 1]]) {
        const neighbor: Cell = [row + dRow, col + dCol];
        if (!present.has(cellKey(neighbor))) continue;
        const remaining = component.filter(
          ([r, c]) => !(r === row && c === col) && !(r === neighbor[0] && c === neighbor[1])
        );
        let resultingXor = 0;
        for (const piece of getConnectedComponents(remaining)) resultingXor ^= grundyOfRegion(piece);
        if ((otherComponentsXor ^ resultingXor) === 0) {
          return [cellToId([row, col]), cellToId(neighbor)];
        }
      }
    }
  }
  return undefined;
};
