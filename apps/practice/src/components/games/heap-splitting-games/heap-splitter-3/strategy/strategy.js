'use strict';

import { random, difference } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => {
  const x = random(4, 20);
  const y = random(Math.max(4, 17 - x), Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const getGameStateAfterMove = (board, { removedheapId, splitheapId, pieceId }) => {
  const keptheapId = difference([0, 1, 2], [removedheapId, splitheapId]);
  const newBoard = [board[keptheapId[0]], pieceId, board[splitheapId] - pieceId];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => board[0] === 1 && board[1] === 1 && board[2] === 1;
