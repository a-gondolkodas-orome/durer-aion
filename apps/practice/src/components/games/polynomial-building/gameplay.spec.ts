import {
  completionValue,
  divisors,
  hasThreeIntegerRoots,
  integerRoots,
  moves,
  type Board,
  type Coef
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isCoefficientChoiceAllowed = moveValidator(moves.setCoefficient);

const sorted = (xs: number[] | null) => (xs === null ? null : [...xs].sort((a, b) => a - b));

describe('divisors', () => {
  it('returns all positive and negative divisors', () => {
    expect(divisors(6).sort((a, b) => a - b)).toEqual([-6, -3, -2, -1, 1, 2, 3, 6]);
    expect(divisors(-6).sort((a, b) => a - b)).toEqual([-6, -3, -2, -1, 1, 2, 3, 6]);
    expect(divisors(7).sort((a, b) => a - b)).toEqual([-7, -1, 1, 7]);
    expect(divisors(1).sort((a, b) => a - b)).toEqual([-1, 1]);
  });
});

describe('integerRoots / hasThreeIntegerRoots', () => {
  it('finds three distinct integer roots (Vieta: roots 1, 2, 3)', () => {
    // (x-1)(x-2)(x-3) = x³ - 6x² + 11x - 6
    expect(sorted(integerRoots(-6, 11, -6))).toEqual([1, 2, 3]);
    expect(hasThreeIntegerRoots(-6, 11, -6)).toBe(true);
  });

  it('handles repeated roots', () => {
    expect(sorted(integerRoots(0, 0, 0))).toEqual([0, 0, 0]); // x³
    expect(sorted(integerRoots(5, 0, 0))).toEqual([-5, 0, 0]); // x²(x+5)
    expect(sorted(integerRoots(-4, 4, 0))).toEqual([0, 2, 2]); // x(x-2)²
  });

  it('handles negative roots', () => {
    // x(x+1)(x+7) = x³ + 8x² + 7x
    expect(sorted(integerRoots(8, 7, 0))).toEqual([-7, -1, 0]);
  });

  it('rejects cubics without three integer roots', () => {
    expect(hasThreeIntegerRoots(0, 0, 1)).toBe(false);  // x³+1: one real root -1, two complex
    expect(hasThreeIntegerRoots(0, 1, 0)).toBe(false);  // x(x²+1): roots 0, ±i
    expect(hasThreeIntegerRoots(0, -2, 0)).toBe(false); // x(x²-2): roots 0, ±√2
    expect(hasThreeIntegerRoots(0, 0, -2)).toBe(false); // x³-2: irrational root
    expect(hasThreeIntegerRoots(-3, -2, 6)).toBe(false); // (x-3)(x²-2): roots 3, ±√2
  });
});

describe('completionValue', () => {
  it('completes b = 0 when a is set and c = 0 (roots 0, 0, -a)', () => {
    expect(completionValue({ a: 5, b: null, c: 0 })).toBe(0);
  });

  it('completes a so that the cubic factors when b, c = 0 are set', () => {
    const v = completionValue({ a: null, b: 7, c: 0 });
    expect(v).not.toBeNull();
    expect(hasThreeIntegerRoots(v as number, 7, 0)).toBe(true);
  });

  it('completes the empty coefficient with c ≠ 0 (roots 1, 2, 3)', () => {
    // x³ - 6x² + 11x - 6
    expect(completionValue({ a: null, b: 11, c: -6 })).toBe(-6);
    expect(completionValue({ a: -6, b: null, c: -6 })).toBe(11);
    expect(completionValue({ a: -6, b: 11, c: null })).toBe(-6);
  });

  it('returns null when no completion gives three integer roots', () => {
    expect(completionValue({ a: 0, b: null, c: -1 })).toBeNull(); // need sum 0, product 1
    expect(completionValue({ a: 0, b: 5, c: null })).toBeNull();  // sum 0, pairwise 5 > 0 impossible
  });

  it('is exact for completions far larger than any fixed cap', () => {
    // b = 5000 (prime-ish large) with c = 0: a = -(1 + 5000) works → roots 0, 1, 5000.
    const v = completionValue({ a: null, b: 5000, c: 0 });
    expect(v).toBe(-5001);
    expect(hasThreeIntegerRoots(-5001, 5000, 0)).toBe(true);
  });
});

describe('isCoefficientChoiceAllowed', () => {
  const empty: Board = { a: null, b: null, c: null };

  it('accepts any integer for a coefficient nobody has fixed', () => {
    expect(isCoefficientChoiceAllowed(empty, 'a', 0)).toBe(true);
    expect(isCoefficientChoiceAllowed(empty, 'b', -7)).toBe(true);
    expect(isCoefficientChoiceAllowed(empty, 'c', 1000000)).toBe(true);
  });

  it('refuses a coefficient that is already set', () => {
    const board: Board = { a: 2, b: null, c: null };
    expect(isCoefficientChoiceAllowed(board, 'a', 5)).toBe(false);
    expect(isCoefficientChoiceAllowed(board, 'b', 5)).toBe(true);
  });

  it('refuses a value that is not an exact integer', () => {
    expect(isCoefficientChoiceAllowed(empty, 'a', 1.5)).toBe(false);
    expect(isCoefficientChoiceAllowed(empty, 'a', NaN)).toBe(false);
    expect(isCoefficientChoiceAllowed(empty, 'a', Infinity)).toBe(false);
    // Beyond 2^53 the root arithmetic would stop being exact.
    expect(isCoefficientChoiceAllowed(empty, 'a', 2 ** 53)).toBe(false);
  });

  it('refuses a name that is not one of the three coefficients', () => {
    expect(isCoefficientChoiceAllowed(empty, 'd' as Coef, 1)).toBe(false);
  });
});

// The game ends when the third coefficient of x³ + ax² + bx + c is fixed;
// player A wins iff all three roots are then integers.
const meta = { ctx: makeCtx() };

const board = (a: number | null, b: number | null, c: number | null): Board => ({ a, b, c });

describe('end of game', () => {
  it('gives the game to A when the finished polynomial has three integer roots', () => {
    // (x + 1)(x + 2)(x + 3) = x³ + 6x² + 11x + 6
    expect(hasThreeIntegerRoots(6, 11, 6)).toBe(true);
    const outcome = moves.setCoefficient.apply(board(6, 11, null), meta, 'c', 6);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to B otherwise', () => {
    // x³ + 1 has one integer root and two complex ones
    expect(hasThreeIntegerRoots(0, 0, 1)).toBe(false);
    const outcome = moves.setCoefficient.apply(board(0, 0, null), meta, 'c', 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while a coefficient is still open', () => {
    const outcome = moves.setCoefficient.apply(board(null, null, null), meta, 'a', 6);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
