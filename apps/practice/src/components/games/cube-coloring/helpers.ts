import { every } from 'lodash';

export type Board = string[]

export const generateStartBoard = (): Board => Array(8).fill('');
export const isColored = (board: Board, i: number) => board[i] !== '';

export const isAllowedStep = (board: Board, vertex, color) => {
  if (isColored(board, vertex)) return false;
  return every(neighbours[vertex], i => (!isColored(board, i)) || board[i] !== color);
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
