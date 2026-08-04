import { random } from 'lodash';
import type { BotStrategy } from '../../../strategy-game-factory';
import type { Board, moves } from './superstitious-counting';

type Bot = BotStrategy<Board, keyof typeof moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'step', args: [randomStep(board.restricted)] });

export const smartBotStrategy: Bot = ({ board: { current, target, restricted } }) => {
  if ((target - current) % 14 === 0) { // any step wins
    return { move: 'step', args: [randomStep(restricted)] };
  }
  if ((target - current) % 14 === 1) { // any step looses
    return { move: 'step', args: [randomStep(restricted)] };
  }
  // only one winning step
  if ((target - current) % 14 - 1 === restricted) {
    return { move: 'step', args: [randomStep(restricted)] };
  }
  return { move: 'step', args: [(target - current) % 14 - 1] };
};

const randomStep = (restricted) => {
  let step = restricted;
  while(step === restricted){
    step = random(1, 12);
  }
  return step;
};
