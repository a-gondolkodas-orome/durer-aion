import type { MoveOutcome } from '../../strategy-game-factory';
export type Coef = 'a' | 'b' | 'c'
export type Board = { a: number | null; b: number | null; c: number | null }

export const COEFS: Coef[] = ['a', 'b', 'c'];

// Any integer may be chosen for any coefficient nobody has fixed yet — the two
// players pick from the same three slots, so whose turn it is does not enter
// into legality. The safe-integer bound is what keeps the root arithmetic
// exact; the board client caps the input at 12 digits for the same reason.
export const isCoefficientChoiceAllowed = (board: Board, coef: Coef, value: number): boolean =>
  COEFS.includes(coef) && board[coef] === null && Number.isSafeInteger(value);

// All integer divisors (positive and negative) of a nonzero integer.
export const divisors = (n: number): number[] => {
  const m = Math.abs(n);
  const result: number[] = [];
  for (let d = 1; d * d <= m; d++) {
    if (m % d !== 0) continue;
    result.push(d, -d);
    if (d !== m / d) result.push(m / d, -(m / d));
  }
  return result;
};

// Every ordered integer triple (p, q, r) with p·q·r = product (product nonzero).
export function* rootTriplesWithProduct(product: number): Generator<[number, number, number]> {
  for (const p of divisors(product)) {
    const rest = product / p; // integer since p | product
    for (const q of divisors(rest)) {
      yield [p, q, rest / q];
    }
  }
}

// Integer roots of x² + px + q, or null if they are not both integers.
const quadraticIntegerRoots = (p: number, q: number): [number, number] | null => {
  const disc = p * p - 4 * q;
  if (disc < 0) return null;
  const s = Math.round(Math.sqrt(disc));
  if (s * s !== disc) return null;
  if ((p + s) % 2 !== 0) return null; // -p ≡ p (mod 2), so this tests (-p ± s) even
  const r1 = (-p + s) / 2;
  const r2 = (-p - s) / 2;
  return [r1 === 0 ? 0 : r1, r2 === 0 ? 0 : r2]; // normalise -0 to 0
};

// The three integer roots of x³ + ax² + bx + c (with multiplicity), or null if
// the cubic does not split into three integer roots.
export const integerRoots = (a: number, b: number, c: number): number[] | null => {
  // A monic cubic with integer roots has every integer root dividing c
  // (rational root theorem); if c = 0 then 0 is a root.
  const candidates = c === 0 ? [0] : divisors(c);
  for (const r of candidates) {
    if (r * r * r + a * r * r + b * r + c !== 0) continue;
    // Synthetic division by (x - r): x² + (a+r)x + (b + r(a+r)).
    const quad = quadraticIntegerRoots(a + r, b + r * (a + r));
    if (quad) return [r, quad[0], quad[1]];
  }
  return null;
};

export const hasThreeIntegerRoots = (a: number, b: number, c: number): boolean =>
  integerRoots(a, b, c) !== null;

// For a board with exactly one empty coefficient: an integer value for it that
// makes the cubic split into three integer roots, or null if none exists.
// Exact — needs no artificial bound on the value.
export const completionValue = (board: Board): number | null => {
  const empty = COEFS.find(k => board[k] === null) as Coef;

  if (empty === 'c') {
    // a, b known. Roots p, q, r satisfy p+q+r = -a and pq+qr+rp = b; then c = -pqr.
    // Fix one root r: p+q = -a-r, pq = b + r(a+r). Real p, q require a non-negative
    // discriminant, which confines r to a finite interval.
    const a = board.a as number, b = board.b as number;
    const spread = 4 * a * a - 12 * b; // ≥ 0 needed for any real root r to exist
    if (spread < 0) return null;
    const half = Math.sqrt(spread);
    for (let r = Math.ceil((-a - half) / 3); r <= Math.floor((-a + half) / 3); r++) {
      const sumPQ = -a - r;
      const prodPQ = b + r * (a + r);
      const disc = sumPQ * sumPQ - 4 * prodPQ;
      if (disc < 0) continue;
      const s = Math.round(Math.sqrt(disc));
      if (s * s !== disc || (sumPQ + s) % 2 !== 0) continue;
      const p = (sumPQ + s) / 2;
      const q = (sumPQ - s) / 2;
      return -(p * q * r);
    }
    return null;
  }

  const c = board.c as number;
  if (c === 0) {
    // 0 is a root; the rest is the quadratic x² + ax + b.
    if (empty === 'b') return 0;                 // a set: roots 0, 0, -a
    return -(1 + (board.b as number));           // b set: roots 0, 1, b
  }
  // c ≠ 0: the roots are an integer triple with product -c (so each divides c).
  for (const [p, q, r] of rootTriplesWithProduct(-c)) {
    if (empty === 'a') {
      if (p * q + q * r + r * p === (board.b as number)) return -(p + q + r);
    } else if (p + q + r === -(board.a as number)) {
      return p * q + q * r + r * p;
    }
  }
  return null;
};

export const canComplete = (board: Board): boolean => completionValue(board) !== null;

export const moves = {
  setCoefficient: {
    validate: (board: Board, _, coef: Coef, value: number) =>
      isCoefficientChoiceAllowed(board, coef, value),
    apply: (board: Board, _, coef: Coef, value: number): MoveOutcome<Board> => {
      const nextBoard = { ...board, [coef]: value };
      const filled = nextBoard.a !== null && nextBoard.b !== null && nextBoard.c !== null;
      if (filled) {
        // A (player 0) wins iff all three roots are integers; otherwise B (player 1).
        const winnerIndex = hasThreeIntegerRoots(nextBoard.a!, nextBoard.b!, nextBoard.c!) ? 0 : 1;
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
