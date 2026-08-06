import { describe, expect, it } from 'vitest';
import {
  applyMove,
  blockMultiset,
  currentWindowSize,
  emptyBoard,
  isTerminal,
  legalMoves,
  moverWins,
  moves,
  secondPlayerWins,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from '../../../test-utils';

const isWindowAllowed = moveValidator(moves.placeWindow);

// ---------------------------------------------------------------------------
// Independent oracle: enumerate legal moves straight from the raw rules (no
// block-decomposition), so it cross-checks the production block reduction.
// ---------------------------------------------------------------------------
const rawMaxMoves = (board: Board): { a: number; b: number }[] => {
  const { n, edges } = board;
  const sizes = [1];
  for (let k = 4; k < n; k += 4) sizes.push(k);

  let best = -1;
  let moves: { a: number; b: number }[] = [];
  for (const k of sizes) {
    for (let a = 0; a + k - 1 < n; a++) {
      const b = a + k - 1;
      let interiorFree = true;
      for (let e = a; e <= b - 1; e++) if (edges[e]) { interiorFree = false; break; }
      if (!interiorFree) continue;
      const leftFree = a > 0 && !edges[a - 1];
      const rightFree = b < n - 1 && !edges[b];
      if (!leftFree && !rightFree) continue;
      if (k > best) { best = k; moves = []; }
      if (k === best) moves.push({ a, b });
    }
  }
  return moves;
};

const edgeKey = (board: Board): string => board.edges.map(e => (e ? 1 : 0)).join('');

const rawMoverWins = (board: Board, memo: Map<string, boolean>): boolean => {
  const key = edgeKey(board);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  let result = false;
  for (const m of rawMaxMoves(board)) {
    if (!rawMoverWins(applyMove(board, m.a, m.b), memo)) { result = true; break; }
  }
  memo.set(key, result);
  return result;
};

const reachableStates = (n: number): Board[] => {
  const seen = new Map<string, Board>();
  const visit = (board: Board) => {
    const key = edgeKey(board);
    if (seen.has(key)) return;
    seen.set(key, board);
    for (const m of rawMaxMoves(board)) visit(applyMove(board, m.a, m.b));
  };
  visit(emptyBoard(n));
  return [...seen.values()];
};

// ---------------------------------------------------------------------------

describe('official characterisation', () => {
  // Answer: the second player wins iff n = 7, n = 8m+1, or n = 8m+4.
  const formulaSecondWins = (n: number) => n === 7 || n % 8 === 1 || n % 8 === 4;

  it('secondPlayerWins matches the official formula for n = 1..60', () => {
    for (let n = 1; n <= 60; n++) {
      expect(secondPlayerWins(n)).toBe(formulaSecondWins(n));
    }
  });
});

describe('block reduction agrees with the raw game', () => {
  it('legalMoves equals the raw rule enumeration on every reachable state', () => {
    for (let n = 5; n <= 13; n++) {
      for (const board of reachableStates(n)) {
        const prod = legalMoves(board).map(m => `${m.a}-${m.b}`).sort();
        const raw = rawMaxMoves(board).map(m => `${m.a}-${m.b}`).sort();
        expect(prod).toEqual(raw);
      }
    }
  });

  it('moverWins over block multisets equals the raw game value everywhere', () => {
    for (let n = 5; n <= 13; n++) {
      const rawMemo = new Map<string, boolean>();
      const blockMemo = new Map<string, boolean>();
      for (const board of reachableStates(n)) {
        expect(moverWins(blockMultiset(board), blockMemo)).toBe(rawMoverWins(board, rawMemo));
      }
    }
  });
});

describe('move mechanics', () => {
  it('first move on an empty board must be the largest multiple of 4 below n', () => {
    expect(currentWindowSize(emptyBoard(9))).toBe(8);
    expect(currentWindowSize(emptyBoard(8))).toBe(4);
    expect(currentWindowSize(emptyBoard(7))).toBe(4);
    expect(currentWindowSize(emptyBoard(13))).toBe(12);
  });

  it('places matches only on the free bounding edges of the window', () => {
    // n = 9, window [0..7] touches the board end on the left, so only edge 7.
    const after = applyMove(emptyBoard(9), 0, 7);
    expect(after.edges.filter(Boolean)).toHaveLength(1);
    expect(after.edges[7]).toBe(true);
    expect(blockMultiset(after)).toEqual([8]);

    // A window strictly inside a block walls off both sides.
    const inside = applyMove(emptyBoard(9), 2, 5);
    expect(inside.edges[1]).toBe(true);
    expect(inside.edges[5]).toBe(true);
    // cells 0-1 (len 2), the window 2-5 (len 4), cells 6-8 (len 3)
    expect(blockMultiset(inside)).toEqual([2, 3, 4]);
  });

  it('a size-1 window in a length-2 block ends that block (both cells become inert)', () => {
    const board: Board = { n: 2, edges: [false] };
    expect(currentWindowSize(board)).toBe(1);
    const after = applyMove(board, 0, 0);
    expect(blockMultiset(after)).toEqual([]);
    expect(currentWindowSize(after)).toBeNull();
  });
});

describe('isWindowAllowed', () => {
  it('accepts exactly the windows the generator lists', () => {
    const board = emptyBoard(10);
    const listed = new Set(legalMoves(board).map(m => `${m.a},${m.b}`));
    for (let a = 0; a < board.n; a++) {
      for (let b = a; b < board.n; b++) {
        expect(isWindowAllowed(board, a, b)).toBe(listed.has(`${a},${b}`));
      }
    }
  });

  it('refuses a window of the wrong size — the largest legal size is forced', () => {
    const board = emptyBoard(10); // largest allowed window here is 8
    expect(currentWindowSize(board)).toBe(8);
    expect(isWindowAllowed(board, 0, 7)).toBe(true);
    expect(isWindowAllowed(board, 0, 0)).toBe(false); // k = 1 is legal in general, but not largest
    expect(isWindowAllowed(board, 0, 3)).toBe(false); // k = 4 likewise
  });

  it('refuses a window that runs off the board', () => {
    const board = emptyBoard(10);
    expect(isWindowAllowed(board, 3, 10)).toBe(false);
    expect(isWindowAllowed(board, -1, 6)).toBe(false);
  });

  it('refuses every window once the game is over', () => {
    const board = { n: 3, edges: [true, true] };
    expect(currentWindowSize(board)).toBe(null);
    expect(isWindowAllowed(board, 0, 0)).toBe(false);
  });
});

// The move size is forced (always the largest legal window), so a position runs
// out of moves on its own; the mover who leaves none wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// Play the first legal move over and over, collecting each outcome.
const playToTheEnd = (start: Board) => {
  const outcomes: ReturnType<typeof moves.placeWindow.apply>[] = [];
  let board = start;
  let player = 0;
  while (!isTerminal(board)) {
    const { a, b } = legalMoves(board)[0];
    const outcome = moves.placeWindow.apply(board, asPlayer(player), a, b);
    outcomes.push(outcome);
    board = outcome.nextBoard;
    player = 1 - player;
  }
  return outcomes;
};

describe('end of game', () => {
  it.each([5, 6, 8, 9])('ends exactly on the last legal move (n = %i)', n => {
    const outcomes = playToTheEnd(emptyBoard(n));
    expect(outcomes.length).toBeGreaterThan(0);

    const last = outcomes[outcomes.length - 1];
    expect(isTerminal(last.nextBoard)).toBe(true);
    // outcomes alternate players starting from 0, so the last mover is known
    expect(last.gameEnd).toEqual({ winnerIndex: (outcomes.length - 1) % 2 });
    expect(last.isTurnEnd).toBeUndefined();

    for (const outcome of outcomes.slice(0, -1)) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
    }
  });
});
