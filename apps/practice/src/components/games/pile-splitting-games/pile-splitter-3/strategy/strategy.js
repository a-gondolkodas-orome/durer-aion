'use strict';

import { random, difference } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => {
  const x = random(4, 20);
  const y = random(Math.max(4, 17 - x), Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const getGameStateAfterMove = (board, { removedPileId, splitPileId, pieceId }) => {
  const keptPileId = difference([0, 1, 2], [removedPileId, splitPileId]);
  const newBoard = [board[keptPileId[0]], pieceId + 1, board[splitPileId] - pieceId - 1];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => board[0] === 1 && board[1] === 1 && board[2] === 1;
