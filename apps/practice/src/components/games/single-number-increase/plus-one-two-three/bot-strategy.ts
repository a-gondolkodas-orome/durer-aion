import type { BotStrategy } from '../../../strategy-game-factory';
import { random } from 'lodash';
import { maxStep, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const nextBoard = board % (1 + maxStep) !== 0
    ? board + (1 + maxStep) - board % (1 + maxStep)
    : board + random(1, maxStep);
  return { move: 'increaseTo', args: [nextBoard] };
};
