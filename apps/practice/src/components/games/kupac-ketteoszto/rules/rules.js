'use strict';

import { generateRandomIntBetween } from '@/lib/generate-random';

export const getBoardAfterPlayerStep = (board, { rowIndex, pieceIndex }) => {
  return [pieceIndex - 1, board[rowIndex] - pieceIndex + 1];
};

export const isGameEnd = board => board[0] === 1 && board[1] === 1;

export const generateNewBoard = () => ([generateRandomIntBetween(3, 10), generateRandomIntBetween(3, 10)]);
