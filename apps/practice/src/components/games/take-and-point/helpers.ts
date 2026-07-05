import { random, range, shuffle } from 'lodash';

// piles: sizes of the piles; a value of 0 means that pile is empty (kept in the
// array so pile indices stay stable across a game). pointed: indices of the
// piles the previous player pointed at (length 1 or 2), or null when the
// current player still has to point.
export type Board = { piles: number[]; pointed: number[] | null };

export const nonEmptyIndices = (piles: number[]): number[] =>
  range(piles.length).filter(i => piles[i] > 0);

export const isTerminal = (board: Board): boolean => board.piles.every(p => p === 0);

export const minPileSize = (piles: number[]): number =>
  Math.min(...piles.filter(p => p > 0));

export const countMinPiles = (piles: number[]): number => {
  const k = minPileSize(piles);
  return piles.filter(p => p === k).length;
};

// A position (viewed by the player who is about to be pointed at and then take)
// is winning exactly when the smallest pile size occurs an odd number of times.
export const removerWins = (piles: number[]): boolean => countMinPiles(piles) % 2 === 1;

export const applyRemoval = (piles: number[], index: number, amount: number): number[] =>
  piles.map((p, i) => (i === index ? p - amount : p));

// Random start position. Every extra pile is strictly larger than the smallest
// pile size, so the number of minimal piles (which decides who wins) is `mCount`
// — drawn uniformly from {1,2,3,4} to keep the two roles at roughly 50/50.
export const generateStartBoard = (): Board => {
  const k = random(1, 3);
  const mCount = random(1, 4);
  const piles = range(mCount).map(() => k);
  const extra = random(0, 2);
  range(extra).forEach(() => piles.push(random(k + 1, 6)));
  while (piles.length < 3) piles.push(random(k + 1, 6));
  return { piles: shuffle(piles), pointed: null };
};
