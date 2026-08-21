import type { BotStrategy } from 'strategy-game-factory';
import { random } from 'lodash';
import { type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = () =>
  random(0, 1) === 0 ? { move: 'add1' } : { move: 'subtract' };

export const smartBotStrategy: Bot = ({ board }) => {
  const [a, b] = board;
  if (a <= b) {
    return { move: 'subtract' };
  }
  if (a <= 2 * b) {
    return { move: 'add1' };
  }

  if (a % 2 === 0 && b % 2 === 0) {
    return { move: 'add1' };
  }
  if (a % 2 === 1 && b % 2 === 1) {
    return { move: 'subtract' };
  }
  if (a % 2 === 1 && b % 2 === 0) {
    return { move: 'subtract' };
  }

  return { move: 'add1' };
};
