import type { BotStrategy } from '../../strategy-game-factory';
import { sample } from 'lodash';
import { getRemaining, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'coverNumber', args: [sample(getRemaining(board))!] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const remaining = getRemaining(board);
  const evens = remaining.filter(i => i%2 === 0);
  const odds = remaining.filter(i => i%2 === 1);
  if (evens.length === odds.length || evens.length === 0 || odds.length === 0) {
    return { move: 'coverNumber', args: [sample(remaining)!] };
  } else if (ctx.currentPlayer === 0) {
    // first player wants same-parity survivors -> remove from the smaller class
    const candidates = evens.length < odds.length ? evens : odds;
    return { move: 'coverNumber', args: [sample(candidates)!] };
  } else {
    // second player wants a mixed pair -> remove from the larger class
    const candidates = evens.length > odds.length ? evens : odds;
    return { move: 'coverNumber', args: [sample(candidates)!] };
  }
};
