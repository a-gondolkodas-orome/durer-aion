import { cap, moverWins, isWinningTake, chooseSmartTake } from './three-more';

type Board = { stones: number; maxTake: number };

const MAX = 80;
const INCREMENT = 3;

// Independent brute-force minimax: the mover with `stones` left and a cap of
// `maxTake` wins iff some legal take either clears the pile or leaves the other
// player (whose cap becomes that take + 3) in a losing position.
const solve = (() => {
  const memo = new Map<string, boolean>();
  const wins = (stones: number, maxTake: number): boolean => {
    if (stones === 0) return false; // previous mover already took the last stone
    const limit = Math.min(maxTake, stones);
    const key = `${stones},${limit}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let result = false;
    for (let k = 1; k <= limit && !result; k++) {
      if (stones - k === 0 || !wins(stones - k, k + INCREMENT)) result = true;
    }
    memo.set(key, result);
    return result;
  };
  return wins;
})();

describe('three-more analysis', () => {
  it('moverWins agrees with an independent brute-force solver', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let m = 1; m <= n + INCREMENT; m++) {
        expect(moverWins(n, m)).toBe(solve(n, m));
      }
    }
  });

  it('the opener (cap = 4) loses exactly when n ≡ 0, 5 or 7 (mod 11)', () => {
    for (let n = 1; n <= MAX; n++) {
      const secondPlayerWins = [0, 5, 7].includes(n % 11);
      expect(moverWins(n, 4)).toBe(!secondPlayerWins);
    }
  });

  it('isWinningTake agrees with the brute-force solver', () => {
    for (let n = 1; n <= MAX; n++) {
      for (let k = 1; k <= n; k++) {
        expect(isWinningTake(n, k)).toBe(n - k === 0 || !solve(n - k, k + INCREMENT));
      }
    }
  });
});

describe('three-more chooseSmartTake', () => {
  // Every board that is a win for the mover.
  const winningBoards: Board[] = [];
  for (let stones = 1; stones <= MAX; stones++) {
    for (let maxTake = 1; maxTake <= stones + INCREMENT; maxTake++) {
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
    const memo = new Map<string, boolean>();
    const smartWins = (board: Board): boolean => {
      const key = `${board.stones},${cap(board)}`;
      const cached = memo.get(key);
      if (cached !== undefined) return cached;
      const k = chooseSmartTake(board);
      const rem = board.stones - k;
      const oppLimit = Math.min(k + INCREMENT, rem);
      let result = rem === 0; // smart took the last stone
      if (!result) {
        result = true;
        for (let j = 1; j <= oppLimit; j++) {
          // opponent takes the last stone, or reaches a position smart can't win.
          if (rem - j === 0 || !smartWins({ stones: rem - j, maxTake: j + INCREMENT })) {
            result = false;
            break;
          }
        }
      }
      memo.set(key, result);
      return result;
    };
    for (const board of winningBoards) {
      expect(smartWins(board)).toBe(true);
    }
  });
});
