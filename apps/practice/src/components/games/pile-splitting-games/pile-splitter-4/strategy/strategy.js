'use strict';

import { random, difference, every } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => ([random(4, 18), random(4, 18), random(4, 18), random(4, 18)]);

export const getGameStateAfterMove = (board, { removedPileId, splitPileId, pieceId }) => {
  const keptRowIndices = difference([0, 1, 2, 3], [removedPileId, splitPileId]);
  const newBoard = [board[keptRowIndices[0]], board[keptRowIndices[1]], pieceId + 1, board[splitPileId] - pieceId - 1];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

export const isTheLastMoverTheWinner = true;

const isGameEnd = (board) => every(board, i => i === 1);

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};
