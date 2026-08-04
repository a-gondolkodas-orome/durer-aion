import type { BotStrategy } from '../../strategy-game-factory';
import { getRandomBotMove, getSmartBotMove, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeStones', args: [getSmartBotMove(board)] });

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeStones', args: [getRandomBotMove(board)] });
