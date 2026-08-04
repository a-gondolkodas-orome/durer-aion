import { random } from 'lodash';
import type { BotStrategy } from '../../../strategy-game-factory';
import type { Board } from './superstitious-counting';

export const randomBotStrategy: BotStrategy<Board> = ({ board }) =>
  ({ move: 'step', args: [randomStep(board.restricted)] });

export const smartBotStrategy: BotStrategy<Board> = ({ board }) => {
  const step = getOptimalBotStep(board);
  return { move: 'step', args: [step] };
};

export const getOptimalBotStep = ({ current, target, restricted }) => {
  if ((target - current) % 14 === 0) { // any step wins
    return randomStep(restricted);
  }
  if ((target - current) % 14 === 1) { // any step looses
    return randomStep(restricted);
  }
  // only one winning step
  if ((target - current) % 14 - 1 === restricted) return randomStep(restricted);
  else return (target - current) % 14 - 1;
};

const randomStep = (restricted) => {
  let step = restricted;
  while(step === restricted){
    step = random(1, 12);
  }
  return step;
};
