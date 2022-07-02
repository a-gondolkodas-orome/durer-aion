'use strict';

import { flatMap, range, sample } from 'lodash-es';

export const generateNewBoard = () => Array(64).fill(null);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const aiMove = getOptimalAiMove(board);
  return getGameStateAfterMove(board, aiMove);
};

export const getGameStateAfterMove = (board, { row, col }) => {
  markForbiddenFields(board, { row, col });

  board[row * 8 + col] = 'bishop';

  return { board, isGameEnd: getAllowedMoves(board).length === 0 };
};

const getOptimalAiMove = (board) => {
  const allowedMirrorMoves = flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })))
    .filter(({ row, col }) => board[row * 8 + col] === null && board[row * 8 + 7 - col] === 'bishop');

  if (allowedMirrorMoves.length > 0) return sample(allowedMirrorMoves);

  const allowedMoves = getAllowedMoves(board);
  return sample(allowedMoves);
};

export const getAllowedMoves = (board) => {
  return flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })))
    .filter(({ row, col }) => board[row * 8 + col] === null);
};

const markForbiddenFields = (board, { row, col }) => {
  range(0, 8).forEach(i => {
    if (row - i >= 0 && col - i >= 0) {
      board[(row - i) * 8 + col - i] = 'forbidden';
    }
    if (row + i <= 7 && col + i <= 7) {
      board[(row + i) * 8 + col + i] = 'forbidden';
    }
    if (row + i <= 7 && col - i >= 0) {
      board[(row + i) * 8 + col - i] = 'forbidden';
    }
    if (row - i >= 0 && col + i <= 7) {
      board[(row - i) * 8 + col + i] = 'forbidden';
    }
  });
};