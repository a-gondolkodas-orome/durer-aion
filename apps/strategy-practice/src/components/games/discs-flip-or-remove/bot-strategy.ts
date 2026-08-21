import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { random, sample, filter } from 'lodash';
import { type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const rem = board[0] % 3;
  if (rem === 0) {
    const randomNonEmptyPile = sample(filter([0, 1], (i) => board[i] > 0))!;
    const amount = board[randomNonEmptyPile] > 1 ? sample([1, 2])! : 1;
    if (randomNonEmptyPile === 0) {
      return { move: 'removeDiscs', args: [amount] };
    } else {
      return { move: 'turnDiscs', args: [amount] };
    }
  } else {
    const amount = 3 - rem;
    if (board[1] >= amount && random(0, 1) === 1) {
      return { move: 'turnDiscs', args: [amount] };
    } else {
      return { move: 'removeDiscs', args: [rem] };
    }
  }
};

export const randomBotStrategy: Bot = ({ board }) => {
  const validMoves: BotMove<Moves>[] = [];
  if (board[0] >= 1) validMoves.push({ move: 'removeDiscs', args: [1] });
  if (board[0] >= 2) validMoves.push({ move: 'removeDiscs', args: [2] });
  if (board[1] >= 1) validMoves.push({ move: 'turnDiscs', args: [1] });
  if (board[1] >= 2) validMoves.push({ move: 'turnDiscs', args: [2] });
  return sample(validMoves)!;
};
