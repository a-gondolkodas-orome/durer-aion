'use strict';

import { random } from 'lodash-es';
import { getAiStep } from './ai-step';

export const generateNewBoard = () => ([random(3, 10), random(3, 10)]);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  return getGameStateAfterMove(board, getAiStep(board));
};

export const getGameStateAfterMove = (board, { rowIndex, pieceIndex }) => {
  const newBoard = [pieceIndex, board[rowIndex] - pieceIndex];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => board[0] === 1 && board[1] === 1;
