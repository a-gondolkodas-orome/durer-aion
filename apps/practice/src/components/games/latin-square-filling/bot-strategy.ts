import type { BotStrategy } from '../../strategy-game-factory';
import { getRandomBotStep, getSmartBotStep, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getSmartBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};

export const randomBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getRandomBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};
