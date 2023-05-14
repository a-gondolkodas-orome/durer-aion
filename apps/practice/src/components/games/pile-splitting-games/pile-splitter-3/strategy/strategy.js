'use strict';

import { random, isEqual } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => {
  const x = random(4, 20);
  const y = random(Math.max(4, 17 - x), Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const getGameStateAfterMove = (board, { removedPileId, splitPileId, pieceId }) => {
  if (removedPileId < splitPileId) {
    board[removedPileId] = pieceId + 1;
    board[splitPileId] = board[splitPileId] - pieceId - 1;
  } else {
    board[removedPileId] = board[splitPileId] - pieceId - 1;
    board[splitPileId] = pieceId + 1;
  }
  return { board, isGameEnd: isGameEnd(board) };
};

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => isEqual(board, [1, 1, 1]);
