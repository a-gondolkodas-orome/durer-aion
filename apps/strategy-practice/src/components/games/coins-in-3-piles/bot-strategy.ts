import { findIndex, sample, range } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// A turn is one decision — which coin to take, which to place back — so it is
// named as a whole. Taking a 1-pengő coin has no place-back half at all.
const asTurn = ({ remove, add }: TurnPlan): BotMove<Moves>[] => {
  const removal: BotMove<Moves> = { move: 'removeCoin', args: [remove] };
  if (remove === 1) return [removal];
  return [removal, add === null ? { move: 'passAddition' } : { move: 'addCoin', args: [add] }];
};

export const randomBotStrategy: Bot = ({ board }) => {
  const remove = sample([1, 2, 3].filter(value => board[value - 1] > 0))!;
  return asTurn({ remove, add: sample([null, ...range(1, remove)]) ?? null });
};

export const smartBotStrategy: Bot = ({ board }) => asTurn(planTurn(board));

type TurnPlan = { remove: number; add: number | null }

// The opponent is lost when the number of odd piles is 0 or 3 (see
// `isLostForMover`), and a turn flips the parity of the pile taken from and of
// the pile placed back into. Two odd piles: even them both out, which needs the
// coin placed back to be worth less than the one taken, so take from the larger.
// One odd pile: take from it and place nothing back. From a lost position no
// turn evens the board out, so take the cheapest coin and hope for a mistake.
export const planTurn = (board: Board): TurnPlan => {
  const oddPiles = [1, 2, 3].filter(value => board[value - 1] % 2 === 1);

  if (oddPiles.length === 2) return { remove: oddPiles[1], add: oddPiles[0] };
  if (oddPiles.length === 1) return { remove: oddPiles[0], add: null };
  return { remove: findIndex(board, count => count > 0) + 1, add: null };
};
