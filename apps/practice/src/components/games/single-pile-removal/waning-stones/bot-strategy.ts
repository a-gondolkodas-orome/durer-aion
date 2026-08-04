import type { BotStrategy } from '../../../strategy-game-factory';
import { range, random, minBy } from 'lodash';
import { type Board, cap } from '../gameplay';
import { type Moves } from './gameplay';

// t(n): the largest power of 2 dividing n (its lowest set bit).
export const lowestPow2 = (n: number): number => n & -n;

// A position (n stones, m max-take) is losing for the mover exactly when m < t(n).
// So taking k wins iff it clears the pile, or hands the opponent such a losing
// position (their new cap k is below the lowest set bit of what remains).
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || k < lowestPow2(stones - k);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const maxTakeable = cap(board);

  const winningTake = lowestPow2(stones);
  if (winningTake <= maxTakeable) return winningTake;

  // Losing position: every legal take hands the opponent a win, so play the
  // "trap" that leaves them the fewest winning replies, breaking ties toward the
  // smaller take (range is ascending and minBy keeps the first minimum) to drag
  // the game out and give the human more chances to err.
  return minBy(range(1, maxTakeable + 1), k => {
    const rem = stones - k;
    const oppCap = Math.min(k, rem);
    return range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
  })!;
};

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'take', args: [chooseSmartTake(board)] });

// Test bot: takes the whole pile if that wins immediately, otherwise a random
// legal amount.
export const randomBotStrategy: Bot = ({ board }) => {
  if (board.stones <= board.maxTake) {
    return { move: 'take', args: [board.stones] };
  }
  return { move: 'take', args: [random(1, cap(board))] };
};
