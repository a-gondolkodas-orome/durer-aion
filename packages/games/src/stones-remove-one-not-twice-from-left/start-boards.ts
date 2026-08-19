import type { Board } from './gameplay';

const fromPiles = (pairs: [number, number][]): Board[] =>
  pairs.map(piles => ({ piles, leftRestriction: [false, false] }));

// The XIX. online round's live boards, flattened from the old strategy.ts
// table indexed [numberOfLoss][winningStreak]: consecutive pairs share a loss
// count, the pair's two members are the streak's two boards. Unlike
// remove-divisor-multiple's, the winning role does not flip within every pair
// — which role can force each board is itself curated, and the spec pins the
// whole list. The order is part of the contract: append, never reorder
// (durer-jatekok#314).
export const competitionStartBoardsE: Board[] = fromPiles([
  [11, 8], [9, 9],
  [9, 8], [9, 7],
  [5, 8], [8, 7],
  [5, 7], [6, 7],
  [6, 4], [3, 6],
  [6, 6], [6, 5]
]);
