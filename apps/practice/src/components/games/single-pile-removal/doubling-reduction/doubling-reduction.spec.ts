import { lowestPow2, cap, isWinningTake, chooseSmartTake } from './doubling-reduction';

// Independent brute-force minimax: the mover with `stones` left and a cap of
// `maxTake` wins iff some legal take either clears the pile or leaves the
// opponent (whose cap becomes 2k − 1, i.e. strictly less than twice that take)
// in a losing position.
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
      if (stones - k === 0 || !wins(stones - k, 2 * k - 1)) result = true;
    }
    memo.set(key, result);
    return result;
  };
  return wins;
})();

const MAX = 48;

type Board = { stones: number; maxTake: number };

describe('doubling-reduction analysis', () => {
  it('mover loses exactly when the cap is below the lowest power of 2 dividing the pile', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let m = 1; m <= 2 * n; m++) {
        expect(solve(n, m)).toBe(Math.min(m, n) >= lowestPow2(n));
      }
    }
  });

  it('the opener (cap = n − 1) loses exactly when n is a power of 2', () => {
    for (let n = 2; n <= MAX; n++) {
      const isPowerOfTwo = (n & (n - 1)) === 0;
      expect(solve(n, n - 1)).toBe(!isPowerOfTwo);
    }
  });

  it('isWinningTake agrees with the brute-force solver', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let k = 1; k <= n; k++) {
        // Taking k wins iff it clears the pile or leaves the opponent (cap 2k − 1) losing.
        expect(isWinningTake(n, k)).toBe(n - k === 0 || !solve(n - k, 2 * k - 1));
      }
    }
  });
});

describe('doubling-reduction chooseSmartTake', () => {
  // Every board that is a win for the mover.
  const winningBoards: Board[] = [];
  for (let stones = 1; stones <= MAX; stones++) {
    for (let maxTake = 1; maxTake <= 2 * stones; maxTake++) {
      if (solve(stones, maxTake)) winningBoards.push({ stones, maxTake });
    }
  }

  it('clears the pile for an immediate win whenever the whole pile is within reach', () => {
    for (let stones = 1; stones <= MAX; stones++) {
      for (let maxTake = stones; maxTake <= 2 * stones; maxTake++) {
        // maxTake >= stones means the mover may take everything and win now.
        expect(chooseSmartTake({ stones, maxTake })).toBe(stones);
      }
    }
  });

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
      const oppLimit = Math.min(2 * k - 1, rem);
      for (let j = 1; j <= oppLimit; j++) {
        if (rem - j === 0) return false; // opponent takes the last stone
        if (!smartWins({ stones: rem - j, maxTake: 2 * j - 1 })) return false;
      }
      return true;
    };
    for (const board of winningBoards) {
      expect(smartWins(board)).toBe(true);
    }
  });

  // Every board that is a loss for the mover. From these the bot cannot win
  // against optimal play, so it plays a "trap" — but it must still make the
  // opponent earn the win rather than handing over an immediate one-move clear.
  const losingBoards: Board[] = [];
  for (let stones = 1; stones <= MAX; stones++) {
    for (let maxTake = 1; maxTake <= 2 * stones; maxTake++) {
      if (!solve(stones, maxTake)) losingBoards.push({ stones, maxTake });
    }
  }

  // A take k lets the opponent clear the whole pile next turn when the remainder
  // is within their cap of 2k − 1.
  const opponentCanClear = (stones: number, k: number) => stones - k <= 2 * k - 1;

  it('never offers an avoidable one-move clear from a losing position', () => {
    for (const board of losingBoards) {
      const c = cap(board);
      const k = chooseSmartTake(board);
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(c);
      // If any legal take denies the opponent a one-move clear, the chosen take
      // must also deny it (only unavoidable in a forced tiny endgame).
      let safeExists = false;
      for (let t = 1; t <= c; t++) if (!opponentCanClear(board.stones, t)) safeExists = true;
      if (safeExists) expect(opponentCanClear(board.stones, k)).toBe(false);
    }
  });
});
