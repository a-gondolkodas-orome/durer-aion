import { random } from 'lodash';
import type { StrategyArgs } from '../../game-factory/types';
import type { Board } from './superstitious-counting';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.step(board, randomStep(board.restricted));
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const step = getOptimalBotStep(board);
  moves.step(board, step);
};

const getOptimalBotStep = ({ current, target, restricted }) => {
  if ((target - current) % 14 === 0) { //any step wins
    return randomStep(restricted);
  }
  if ((target - current) % 14 === 1) { //any step looses
    return randomStep(restricted);
  }
  //only one winning step
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
