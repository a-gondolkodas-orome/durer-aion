import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { random, sample } from 'lodash';

// Board: a 1 x n strip of cells (indices 0..n-1). Between cell i and cell i+1
// sits the dividing edge with index i (0..n-2); `edges[i]` is true once a match
// has been placed on it. A move selects a 1 x k subtable (a window of k
// consecutive cells) whose interior contains no match, and places a match on
// each match-free edge bounding the window. A move is legal when it places at
// least one match and either k = 1 or k is divisible by 4. On each turn the
// player must play one of the *largest* legal moves.
export type Board = { n: number; edges: boolean[] };

export type Move = { a: number; b: number; k: number };

// Matched edges act as walls, splitting the strip into independent blocks of
// consecutive cells that carry no interior match. A block's own boundary (a
// matched edge or the end of the board) never matters for future play, so a
// position is fully described by the multiset of block lengths.
export const blocks = (board: Board): { start: number; length: number }[] => {
  const result: { start: number; length: number }[] = [];
  let start = 0;
  for (let i = 0; i < board.n; i++) {
    const wallAfter = i === board.n - 1 || board.edges[i];
    if (wallAfter) {
      result.push({ start, length: i - start + 1 });
      start = i + 1;
    }
  }
  return result;
};

// Largest allowed window size (1, or a multiple of 4) that fits *strictly*
// inside a block of length `maxBlockLength`. Returns null when no block can host
// any window, i.e. the game is over.
const allowedWindowSize = (maxBlockLength: number): number | null => {
  if (maxBlockLength < 2) return null;
  let k = 1;
  for (let c = 4; c < maxBlockLength; c += 4) k = c;
  return k;
};

// The size k every legal move on this board must use (the forced largest move).
export const currentWindowSize = (board: Board): number | null => {
  const bs = blocks(board);
  if (bs.length === 0) return null;
  const maxBlockLength = Math.max(...bs.map(b => b.length));
  return allowedWindowSize(maxBlockLength);
};

// All legal moves (they all share the forced size k). Each move is the window
// [a, b] of cells; only windows strictly smaller than their block are legal, so
// every move leaves at least one free bounding edge to place a match on.
export const legalMoves = (board: Board): Move[] => {
  const k = currentWindowSize(board);
  if (k === null) return [];
  const moves: Move[] = [];
  for (const block of blocks(board)) {
    if (block.length <= k) continue;
    for (let p = 0; p <= block.length - k; p++) {
      const a = block.start + p;
      moves.push({ a, b: a + k - 1, k });
    }
  }
  return moves;
};

// Is [a, b] one of the windows the player to move may play? The size is forced
// (always the largest legal one), and the window must sit strictly inside a
// single match-free block — so this is not a bounds check but the game's whole
// move rule. Matching against the generated list keeps the two definitions from
// drifting; there are only O(n) legal moves.
const isWindowAllowed = (board: Board, a: number, b: number): boolean =>
  legalMoves(board).some(m => m.a === a && m.b === b);

// The bounding edges of window [a, b] that are still free and would receive a
// match. Used both to apply a move and to preview it in the UI.
export const boundaryEdgesToPlace = (board: Board, a: number, b: number): number[] => {
  const result: number[] = [];
  if (a > 0 && !board.edges[a - 1]) result.push(a - 1);
  if (b < board.n - 1 && !board.edges[b]) result.push(b);
  return result;
};

export const applyMove = (board: Board, a: number, b: number): Board => {
  const edges = board.edges.slice();
  for (const e of boundaryEdgesToPlace(board, a, b)) edges[e] = true;
  return { n: board.n, edges };
};

export const isTerminal = (board: Board): boolean => currentWindowSize(board) === null;

// The position as the sorted multiset of block lengths >= 2 (length-1 blocks can
// never host a move, so they are inert and dropped). This is the compact state
// the optimal solver reasons over.
export const blockMultiset = (board: Board): number[] =>
  blocks(board)
    .map(b => b.length)
    .filter(length => length >= 2)
    .sort((x, y) => x - y);

// Does the player to move win from this multiset of block lengths, under optimal
// play? Memoised on the canonical (sorted) key.
export const moverWins = (multiset: number[], memo: Map<string, boolean> = new Map()): boolean => {
  const key = multiset.join(',');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let result = false;
  if (multiset.length > 0) {
    const maxBlockLength = multiset[multiset.length - 1];
    const k = allowedWindowSize(maxBlockLength)!; // >= 1 whenever a block >= 2 exists
    outer: for (let i = 0; i < multiset.length; i++) {
      const length = multiset[i];
      if (length <= k) continue;
      const rest = multiset.slice(0, i).concat(multiset.slice(i + 1));
      for (let p = 0; p <= length - k; p++) {
        const q = length - k - p;
        const next = rest
          .concat([p, k, q].filter(x => x >= 2))
          .sort((a, b) => a - b);
        if (!moverWins(next, memo)) {
          result = true;
          break outer;
        }
      }
    }
  }
  memo.set(key, result);
  return result;
};

// True when the *second* player wins the whole game for a given n (optimal play).
export const secondPlayerWins = (n: number): boolean =>
  n >= 2 ? !moverWins(blockMultiset({ n, edges: new Array(n - 1).fill(false) })) : true;

// Starting n is drawn so that the winning role is first ~50% of the time and
// second ~50% of the time, keeping the role choice meaningful. n stays small
// enough to fit a single strip on screen.
const SECOND_WIN_NS = [7, 9, 12];
const FIRST_WIN_NS = [8, 10, 11, 13];

export const generateStartBoard = (): Board => {
  const n = sample(random(0, 1) === 0 ? SECOND_WIN_NS : FIRST_WIN_NS)!;
  return { n, edges: new Array(n - 1).fill(false) };
};

export const emptyBoard = (n: number): Board => ({ n, edges: new Array(n - 1).fill(false) });

export const moves = {
  // Place the length-k subtable [a, b]: matches go on its free bounding edges.
  // If that leaves the other player with no legal move, they lose; otherwise the
  // turn passes.
  placeWindow: {
    validate: (board: Board, _, a: number, b: number) => isWindowAllowed(board, a, b),
    apply: (
      board: Board, { ctx }: { ctx: Ctx }, a: number, b: number
    ): MoveOutcome<Board> => {
      const nextBoard = applyMove(board, a, b);
      if (isTerminal(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
