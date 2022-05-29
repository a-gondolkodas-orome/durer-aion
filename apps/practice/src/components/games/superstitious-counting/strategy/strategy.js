'use strict';

import { random } from 'lodash-es';
import { getAiStep } from './ai-step';

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
