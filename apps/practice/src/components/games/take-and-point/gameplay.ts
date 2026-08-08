import { random, range, shuffle, uniq } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

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

// How many piles the pointing player must indicate: two, or just the one when
// a single non-empty pile is left.
export const requiredPointCount = (piles: number[]): number =>
  nonEmptyIndices(piles).length === 1 ? 1 : 2;

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

// The two halves of a turn are told apart by the board alone: `pointed` is null
// until someone has pointed, and `takeStones` clears it again. Pointing means
// naming exactly the required number of distinct non-empty piles.
const isPointingAllowed = (board: Board, indices: number[]): boolean =>
  board.pointed === null
    && Array.isArray(indices)
    && indices.length === requiredPointCount(board.piles)
    && uniq(indices).length === indices.length
    && indices.every(i => board.piles[i] > 0);

// Taking means removing between one stone and the whole pile from one of the
// piles the other player pointed at.
const isRemovalAllowed = (board: Board, index: number, amount: number): boolean =>
  board.pointed !== null
    && board.pointed.includes(index)
    && Number.isInteger(amount) && amount >= 1 && amount <= board.piles[index];

export const moves = {
  // Take `amount` stones from a pointed pile. The turn does NOT end here: the
  // same player then points at piles for the other player (see `pointPiles`).
  takeStones: {
    validate: (board: Board, _, index: number, amount: number) =>
      isRemovalAllowed(board, index, amount),
    apply: (
      board: Board, { ctx }: { ctx: Ctx }, index: number, amount: number
    ): MoveOutcome<Board> => {
      const nextBoard: Board = { piles: applyRemoval(board.piles, index, amount), pointed: null };
      if (isTerminal(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard };
    }
  },

  // Point at the piles the other player will choose from, then hand over the turn.
  pointPiles: {
    validate: (board: Board, _, indices: number[]) => isPointingAllowed(board, indices),
    apply: (board: Board, _, indices: number[]): MoveOutcome<Board> =>
      ({ nextBoard: { piles: board.piles, pointed: indices }, isTurnEnd: true })
  }
};

export type Moves = typeof moves;
