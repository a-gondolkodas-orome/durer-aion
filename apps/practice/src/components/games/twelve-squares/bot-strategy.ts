import type { BotStrategy } from 'strategy-game-factory';
import { random, sample } from 'lodash';
import { isValidStep, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const validSteps = [1, 2].filter(step => isValidStep(board, step));
  return { move: 'step', args: [sample(validSteps)!] };
};

export const optimalBotStrategy: Bot = ({ board: { left, right } }) => {
  const dst = right-left;
  if(dst === 1) return { move: 'step', args: [2] };
  if(dst === 2) return { move: 'step', args: [1] };
  if(dst % 3 === 2) return { move: 'step', args: [random(1,2)] };
  return { move: 'step', args: [(dst+1) % 3] };
};
