'use strict';

import { isNull, every } from 'lodash';

export const allColors = ['#dc2626', '#eab308', '#2563eb'];

export const isAllowedStep = (board, vertex, color) => {
  if (!isNull(board[vertex])) return false;
  return every(neighbours[vertex], i => isNull(board[i]) || board[i] !== color);
};

export const neighbours = {
  0: [1, 3, 4],
  1: [0, 2, 5],
  2: [1, 3, 4, 6],
  3: [0, 2, 7],
  4: [0, 2, 5, 7],
  5: [1, 4, 6],
  6: [2, 5, 7],
  7: [3, 4, 6]
};
