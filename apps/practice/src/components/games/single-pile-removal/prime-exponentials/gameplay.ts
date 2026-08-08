import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { random } from 'lodash';

export type Board = number

/* eslint-disable array-element-newline */
const primeList = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
];
/* eslint-enable array-element-newline */

export const allPrimePowers = (() => {
  const entries = [{ prime: 2, exponent: 0, value: 1 }];
  for (const p of primeList) {
    for (let e = 1; p ** e < 1000; e++) {
      entries.push({ prime: p, exponent: e, value: p ** e });
    }
  }
  return entries.sort((a, b) => a.value - b.value);
})();

export const generateStartBoard = () => {
  if (random(0, 1)) {
    return random(3, 166) * 6;
  } else {
    return random(3, 166) * 6 + random(1, 5);
  }
};

export const generateSmallStartBoard = () => random(12, 72);

export const moves = {
  subtractPrimeExponent: {
    // Only a genuine prime power that fits within the number may be subtracted,
    // so legality is membership in the enumeration above rather than an
    // arithmetic check, which would also accept a composite base.
    validate: (board: Board, _, { prime, exponent }: { prime: number; exponent: number }) =>
      allPrimePowers.some(e => e.prime === prime && e.exponent === exponent && e.value <= board),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { prime, exponent }: { prime: number; exponent: number }
    ): MoveOutcome<Board> => {
      const nextBoard = board - prime ** exponent;
      if (nextBoard === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
