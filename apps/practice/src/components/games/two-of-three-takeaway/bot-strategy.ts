import type { BotStrategy } from '../../strategy-game-factory';
import { getRandomBotMove, getSmartBotMove, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const [i, j] = getSmartBotMove(board);
  return { move: 'takeChips', args: [i, j] };
};

export const randomBotStrategy: Bot = ({ board }) => {
  const [i, j] = getRandomBotMove(board);
  return { move: 'takeChips', args: [i, j] };
};
