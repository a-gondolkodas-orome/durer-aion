'use strict';

import { sum, isEqual, cloneDeep } from 'lodash-es';
import { getOptimalTileIndex } from './ai-step';

export const generateNewBoard = () => [0, 0, 0, 0];

export const getGameStateAfterAiMove = (board) => {
  const tileIndex = getOptimalTileIndex(board);
  return getGameStateAfterMove(board, tileIndex);
};

export const getGameStateAfterMove = (board, tileIndex) => {
  const boardForStep = cloneDeep(board);
  boardForStep[tileIndex] = boardForStep[tileIndex] + 1;
  return {
    board: boardForStep,
    isGameEnd: sum(boardForStep) >= 6,
    hasFirstPlayerWon: !isEqual([...boardForStep].sort(), [0, 1, 2, 3])
  };
};

export const isTheLastMoverTheWinner = null;
