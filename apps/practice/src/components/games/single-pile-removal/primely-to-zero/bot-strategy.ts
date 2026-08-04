import type { BotStrategy } from '../../../strategy-game-factory';
import { sample } from 'lodash';
import { isValidStep, validSteps, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const step = isValidStep(board) ? board : sample([...validSteps].filter(s => s < board))!;
  return { move: 'moveTo', args: [board - step] };
};

export const smartBotStrategy: Bot = ({ board }) => {
  const remainder = board % 4;
  let step: number;
  if (remainder !== 0) {
    // all valid steps ≡ remainder (mod 4) land on a multiple of 4
    const winningSteps = [...validSteps].filter(s => s <= board && (board - s) % 4 === 0);
    step = sample(winningSteps)!;
  } else {
    // losing position: pick any valid step
    const steps = [...validSteps].filter(s => s <= board);
    step = sample(steps)!;
  }
  return { move: 'moveTo', args: [board - step] };
};
