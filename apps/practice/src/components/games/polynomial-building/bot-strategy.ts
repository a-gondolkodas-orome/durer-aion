import { random, sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import {
  type Board, type Coef, COEFS, rootTriplesWithProduct, completionValue, canComplete
} from './helpers';
import type { Moves } from './polynomial-building';

type Bot = BotStrategy<Board, Moves>

// Weak bot: plays a random legal move, but completes to a win on the last move
// when it can (only the first player, who always makes the final move, can win in 1).
export const randomBotStrategy: Bot = ({ board }) => {
  const empties = COEFS.filter(k => board[k] === null);
  const coef = sample(empties)!;
  if (empties.length === 1) {
    return { move: 'setCoefficient', args: [coef, completionValue(board) ?? random(-9, 9)] };
  }
  return { move: 'setCoefficient', args: [coef, random(-9, 9)] };
};

// Nonzero, moderate values used as a "trap" when the second player is already
// lost: setting a still-empty coefficient to one of these forces the first
// player to find the completing factorisation, maximising the chance of a slip.
const TRAP_VALUES = [-8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8];

// A first move is winning iff it is c = 0 (forces root 0) or b = -1 (forces the
// antipodal pair {1, -1} as two roots). These are the only two winning moves.
const isWinningFirstMove = (setCoef: Coef, board: Board): boolean =>
  (setCoef === 'c' && board.c === 0) || (setCoef === 'b' && board.b === -1);

// Constructive winning reply to a losing first move. Each case is proven, and is
// re-checked against `canComplete` at runtime; returns null on the (unexpected)
// event that it does not block, so the caller can fall back to a trap.
const blockingMove = (board: Board): [Coef, number] | null => {
  let candidate: [Coef, number];
  if (board.a !== null) {
    // a = α set. Answer c = ±1 forces the roots to be ±1, whose sum lies in
    // {1,-3} (c=1) or {3,-1} (c=-1); one of these excludes -α.
    candidate = ['c', (board.a === -1 || board.a === 3) ? -1 : 1];
  } else if (board.b !== null) {
    // b = β set (β ≠ -1). β > 0: three reals summing to 0 have pairwise sum
    // ≤ 0 < β, so a = 0 makes c uncompletable. β ≤ 0: roots ±1 have pairwise
    // sum ∈ {-1, 3} ≠ β, so c = 1 blocks.
    candidate = board.b > 0 ? ['a', 0] : ['c', 1];
  } else {
    // c = γ set (γ ≠ 0). The roots' product is fixed at -γ, so only finitely
    // many root sums are reachable; set a = -t for a sum t that is not.
    const reachableSums = new Set<number>();
    for (const [p, q, r] of rootTriplesWithProduct(-(board.c as number))) {
      reachableSums.add(p + q + r);
    }
    let t = 0;
    while (reachableSums.has(t)) t++;
    candidate = ['a', -t];
  }
  const after = { ...board, [candidate[0]]: candidate[1] };
  return canComplete(after) ? null : candidate;
};

// Optimal strategy. Turn is fully determined by how many coefficients are empty:
// 3 empty → first player's move 1, 2 empty → second player's move 2,
// 1 empty → first player's move 3. The first player has the last move and always
// wins with correct play.
export const smartBotStrategy: Bot = ({ board }) => {
  const empties = COEFS.filter(k => board[k] === null);

  // First player, move 1: pick randomly between the two winning first moves —
  // c = 0 (forces root 0) and b = -1 (forces the pair {1, -1}).
  if (empties.length === 3) {
    const [coef, value] = sample([['c', 0], ['b', -1]] as [Coef, number][])!;
    return { move: 'setCoefficient', args: [coef, value] };
  }

  // First player, move 3: complete to three integer roots if possible.
  if (empties.length === 1) {
    return { move: 'setCoefficient', args: [empties[0], completionValue(board) ?? 0] };
  }

  // Second player, move 2.
  const setCoef = COEFS.find(k => board[k] !== null) as Coef;
  if (!isWinningFirstMove(setCoef, board)) {
    const block = blockingMove(board);
    if (block) {
      return { move: 'setCoefficient', args: [block[0], block[1]] };
    }
  }

  // The first player is winning (or, defensively, no block found): play a
  // losing-but-tricky move.
  const trapCoef: Coef = empties.includes('b') ? 'b' : empties[0];
  return { move: 'setCoefficient', args: [trapCoef, sample(TRAP_VALUES)!] };
};
