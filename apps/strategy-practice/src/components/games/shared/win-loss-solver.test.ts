import { range, sortBy } from 'lodash';
import { createWinLossSolver } from './win-loss-solver';

// The subtraction game: a heap of n counters, a move takes 1 or 2, and the
// player facing an empty heap loses. Its value is textbook — the mover loses
// exactly when n is a multiple of 3 — so it pins the solver against a known
// answer rather than against itself.
const subtraction = () => createWinLossSolver<number, number>({
  key: (n) => `${n}`,
  legalMoves: (n) => [1, 2].filter((take) => take <= n),
  apply: (n, take) => n - take
});

describe('createWinLossSolver', () => {
  it('matches the known characterisation of the subtraction game', () => {
    const { isWinningForMover } = subtraction();
    const wrong = range(0, 31).filter((n) => isWinningForMover(n) !== (n % 3 !== 0));
    expect(wrong).toEqual([]);
  });

  it('reads a position with no legal move as a loss for the mover', () => {
    const { isWinningForMover, winningMoves } = subtraction();
    expect(isWinningForMover(0)).toBe(false);
    expect(winningMoves(0)).toEqual([]);
  });

  it('offers winning moves exactly at winning positions', () => {
    const { isWinningForMover, winningMoves } = subtraction();
    range(0, 31).forEach((n) => {
      expect(winningMoves(n).length > 0).toBe(isWinningForMover(n));
    });
  });

  it('names every winning move, not just the first', () => {
    // From 4 only taking 1 leaves a multiple of 3; from 3 neither take does.
    const { winningMoves } = subtraction();
    expect(winningMoves(4)).toEqual([1]);
    expect(winningMoves(5)).toEqual([2]);
    expect(winningMoves(3)).toEqual([]);
  });

  it('answers a repeated question from the memo', () => {
    let keyCalls = 0;
    const { isWinningForMover } = createWinLossSolver<number, number>({
      key: (n) => { keyCalls++; return `${n}`; },
      legalMoves: (n) => [1, 2].filter((take) => take <= n),
      apply: (n, take) => n - take
    });

    isWinningForMover(20);
    const afterFirst = keyCalls;
    isWinningForMover(20);
    expect(keyCalls - afterFirst).toBe(1);
  });

  it('searches positions the key identifies only once', () => {
    // Take one counter from any pile; equal multisets of piles are the same
    // position, and a key that sorts is what tells the solver so.
    const board = [2, 2, 2];
    const legalMoves = (piles: number[]) =>
      range(piles.length).filter((i) => piles[i] > 0);
    const apply = (piles: number[], i: number) =>
      piles.map((size, idx) => (idx === i ? size - 1 : size));

    const visited = (key: (piles: number[]) => string) => {
      const seen = new Set<string>();
      const { isWinningForMover } = createWinLossSolver<number[], number>({
        key: (piles) => { seen.add(piles.join(',')); return key(piles); },
        legalMoves,
        apply
      });
      isWinningForMover(board);
      return seen.size;
    };

    expect(visited((piles) => sortBy(piles).join(','))).toBeLessThan(
      visited((piles) => piles.join(','))
    );
  });
});
