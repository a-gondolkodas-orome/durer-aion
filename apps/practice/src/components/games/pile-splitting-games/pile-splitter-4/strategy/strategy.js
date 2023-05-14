'use strict';

import { random, isEqual } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => ([random(4, 18), random(4, 18), random(4, 18), random(4, 18)]);

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

const isGameEnd = (board) => isEqual(board, [1, 1, 1, 1]);

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};
