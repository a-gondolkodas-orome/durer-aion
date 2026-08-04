import type { BotStrategy } from '../../../strategy-game-factory';
import { random } from 'lodash';
import { type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  if (board % 2 === 0 && random(0, 1) === 0) {
    return { move: 'halve' };
  } else {
    return { move: 'take1' };
  }
};

export const smartBotStrategy: Bot = ({ board }) => {
  if (board !== 4 && board % 4 === 0) {
    return { move: 'take1' };
  } else if (board === 6) {
    return { move: 'take1' };
  } else if (board % 2 === 0) {
    return { move: 'halve' };
  } else {
    return { move: 'take1' };
  }
};
