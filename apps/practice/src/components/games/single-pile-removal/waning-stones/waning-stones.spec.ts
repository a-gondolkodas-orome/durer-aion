import { lowestPow2, cap, isWinningTake, chooseSmartTake } from './waning-stones';

// Independent brute-force minimax: the mover with `stones` left and a cap of
// `maxTake` wins iff some legal take either clears the pile or leaves the
// opponent (whose cap becomes that take) in a losing position.
const solve = (() => {
  const memo = new Map<string, boolean>();
  const wins = (stones: number, maxTake: number): boolean => {
    if (stones === 0) return false; // previous mover already took the last stone
    const key = `${stones},${maxTake}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    const limit = Math.min(maxTake, stones);
    let result = false;
    for (let k = 1; k <= limit && !result; k++) {
      if (stones - k === 0 || !wins(stones - k, k)) result = true;
    }
    memo.set(key, result);
    return result;
  };
  return wins;
})();

const MAX = 32;

type Board = { stones: number; maxTake: number };

describe('waning-stones analysis', () => {
  it('mover loses exactly when the cap is below the lowest power of 2 dividing the pile', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let m = 1; m <= n; m++) {
        expect(solve(n, m)).toBe(m >= lowestPow2(n));
      }
    }
  });

  it('the opener (cap = ⌊n/2⌋) loses exactly when n is a power of 2', () => {
    for (let n = 2; n <= MAX; n++) {
      const isPowerOfTwo = (n & (n - 1)) === 0;
      expect(solve(n, Math.floor(n / 2))).toBe(!isPowerOfTwo);
    }
  });

  it('isWinningTake agrees with the brute-force solver', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let k = 1; k <= n; k++) {
        // Taking k wins iff it clears the pile or leaves the opponent losing.
        expect(isWinningTake(n, k)).toBe(n - k === 0 || !solve(n - k, k));
      }
    }
  });
});

describe('waning-stones chooseSmartTake', () => {
  // Every board that is a win for the mover.
  const winningBoards: Board[] = [];
  for (let stones = 1; stones <= MAX; stones++) {
    for (let maxTake = 1; maxTake <= stones; maxTake++) {
      if (solve(stones, maxTake)) winningBoards.push({ stones, maxTake });
    }
  }

  it('always picks a legal, genuinely winning take from a winning position', () => {
    for (const board of winningBoards) {
      const k = chooseSmartTake(board);
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(cap(board));
      expect(isWinningTake(board.stones, k)).toBe(true);
    }
  });

  it('wins against every possible opponent reply (full playout)', () => {
    const smartWins = (board: Board): boolean => {
      const k = chooseSmartTake(board);
      const rem = board.stones - k;
      if (rem === 0) return true; // smart took the last stone
      const oppLimit = Math.min(k, rem);
      for (let j = 1; j <= oppLimit; j++) {
        if (rem - j === 0) return false; // opponent takes the last stone
        if (!smartWins({ stones: rem - j, maxTake: j })) return false;
      }
      return true;
    };
    for (const board of winningBoards) {
      expect(smartWins(board)).toBe(true);
    }
  });
});
