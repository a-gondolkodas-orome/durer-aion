'use strict';

import { random, difference, every } from 'lodash-es';
import { getBoardAfterAiStep } from './ai-step';

export const generateNewBoard = () => ([random(4, 18), random(4, 18), random(4, 18), random(4, 18)]);

export const getGameStateAfterMove = (board, { removedRowIndex, splitRowIndex, pieceIndex }) => {
  const keptRowIndices = difference([0, 1, 2, 3], [removedRowIndex, splitRowIndex]);
  const newBoard = [board[keptRowIndices[0]], board[keptRowIndices[1]], pieceIndex, board[splitRowIndex] - pieceIndex];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

export const isTheLastMoverTheWinner = true;

const isGameEnd = (board) => every(board, i => i === 1);

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};
