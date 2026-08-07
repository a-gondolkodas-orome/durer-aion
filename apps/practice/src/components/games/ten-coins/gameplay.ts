import { uniq, sample, random } from 'lodash';
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

// The board is the multiset of coin values. Only which distinct values are
// present matters for the game logic; the counts are pure flavour. The two
// variants differ only in the range of allowed values (1..4 for category C,
// 1..5 for the harder category D) — encoded purely in the start board, so the
// solver, moves and board rendering are all shared and board-driven.
export type Board = number[]
// The coin value the player selected, while choosing what to change it to.
export type TurnState = number

const totalCoins = 10;

// A move needs a value K that is actually on the table, and a strictly smaller
// positive L to turn those coins into. Both players draw on the same table, so
// whose turn it is does not enter into legality.
const isConversionAllowed = (board: Board, k: number, l: number): boolean =>
  Number.isInteger(k) && Number.isInteger(l) && l >= 1 && l < k && board.includes(k);

export const moves = {
  convert: {
    validate: (board: Board, _: { ctx: Ctx<TurnState> }, k: number, l: number) =>
      isConversionAllowed(board, k, l),
    apply: (
      board: Board, { ctx }: { ctx: Ctx<TurnState> }, k: number, l: number
    ): MoveOutcome<Board, TurnState> => {
      const nextBoard = board.map(v => (v === k ? l : v)).sort((a, b) => a - b);
      if (uniq(nextBoard).length === 1) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

// Distribute `total` coins among `parts` values, each value getting at least one.
const randomCounts = (total: number, parts: number): number[] => {
  const counts = Array(parts).fill(1);
  for (let i = 0; i < total - parts; i++) counts[random(0, parts - 1)]++;
  return counts;
};

const boardFromSet = (set: number[]): Board => {
  const counts = randomCounts(totalCoins, set.length);
  return set.flatMap((v, i) => Array(counts[i]).fill(v));
};

// Category C (values 1..4). Mix of starts: ~half are {1,2,3} (second player wins),
// ~half are a first-player win, so choosing the right role genuinely matters.
export const generateStartBoardC = (): Board => boardFromSet(
  random(0, 1) === 0
    ? [1, 2, 3]
    : sample([[1, 2, 4], [1, 3, 4], [2, 3, 4], [1, 2, 3, 4]])!
);

// Category D (values 1..5). Same idea over the larger set of losing/winning sets.
const losingSetsD = [[1, 2, 3], [1, 4, 5], [2, 3, 4, 5], [1, 2, 3, 4, 5]];
const winningSetsD = [
  [1, 2, 4],
[1, 3, 4],
[2, 3, 4],
[1, 2, 5],
[1, 3, 5],
[2, 3, 5],
  [2, 4, 5],
[3, 4, 5],
[1, 2, 3, 4],
[1, 2, 3, 5],
[1, 2, 4, 5],
[1, 3, 4, 5]
];
export const generateStartBoardD = (): Board => boardFromSet(
  random(0, 1) === 0 ? sample(losingSetsD)! : sample(winningSetsD)!
);

// Test variant covers both sub-games: a values-1..4 or a values-1..5 start.
export const generateTestStartBoard = (): Board => sample([generateStartBoardC, generateStartBoardD])!();
