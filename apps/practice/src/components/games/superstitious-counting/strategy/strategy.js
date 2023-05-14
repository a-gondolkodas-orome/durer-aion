'use strict';

import { random } from 'lodash-es';

export const getGameStateAfterAiMove = (board) => {
  return getGameStateAfterMove(board, getAiStep(board));
};

export const generateNewBoard = () => {
  return { current: 0, target: random(20, 100), restricted: null };
};

export const isTheLastMoverTheWinner = false;

export const getGameStateAfterMove = (board, step) => {
  const numberAfterStep = board.current + step;
  const isGameEnd = numberAfterStep >= board.target;
  return {
    board: { current: numberAfterStep, target: board.target, restricted: 13 - step },
    isGameEnd
  };
};

const getAiStep = ({ current, target, restricted }) => {
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
