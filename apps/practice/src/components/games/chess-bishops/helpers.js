'use strict';

import { flatMap, range } from 'lodash';

export const generateStartBoard = () => {
  return range(0, 8).map(() => range(0, 8).map(() => null));
};

export const boardIndices = flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })));

export const BISHOP = 1;
export const FORBIDDEN = 2;

export const getAllowedMoves = (board) => {
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

export const markForbiddenFields = (board, { row, col }) => {
  range(0, 8).forEach(i => {
    if (row - i >= 0 && col - i >= 0) {
      board[(row - i)][col - i] = FORBIDDEN;
    }
    if (row + i <= 7 && col + i <= 7) {
      board[(row + i)][col + i] = FORBIDDEN;
    }
    if (row + i <= 7 && col - i >= 0) {
      board[(row + i)][col - i] = FORBIDDEN;
    }
    if (row - i >= 0 && col + i <= 7) {
      board[(row - i)][col + i] = FORBIDDEN;
    }
  });
};
