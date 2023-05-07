'use strict';

import { sum, isEqual, random } from 'lodash-es';
import { getOptimalTileIndex, getOptimalTileIndices } from './ai-step';

export const generateNewBoard = () => {
  const board = Array(5).fill(0);
  const x = random(4);
  board[x] += 1;
  return board;
};

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  if(isPlayerTheFirstToMove){
    const tileIndices = getOptimalTileIndices(board);
    board[tileIndices[0]] += 1;
    board[tileIndices[1]] += 1;
    return getGameStateAfterMove(board);
  } else {
    const tileIndex = getOptimalTileIndex(board);
    board[tileIndex] += 1;
    return getGameStateAfterMove(board);
  }
};

export const getGameStateAfterMove = (board) => {
  return {
    board: board,
    isGameEnd: sum(board) >= 10,
    hasFirstPlayerWon: !isEqual([...board].sort(), [0, 1, 2, 3, 4])
  };
};

export const isTheLastMoverTheWinner = null;
