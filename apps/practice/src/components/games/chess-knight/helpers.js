'use strict';

import { range, random } from 'lodash';

export const generateStartBoard = () => {
  const board = range(0, 4).map(() => range(0, 4).map(() => null));
  const initialPosition = { row: random(0, 3), col: random(0, 3) };
  board[initialPosition.row][initialPosition.col] = 'knight';
  return {
    chessBoard: board,
    knightPosition: initialPosition
  };
};

export const getAllowedMoves = (board) => {
  const { row, col } = board.knightPosition;

  const allowedMoves = [];
  allowedMoves.push({ row: row - 1, col: col - 2 });
  allowedMoves.push({ row: row - 1, col: col + 2 });
  allowedMoves.push({ row: row + 1, col: col - 2 });
  allowedMoves.push({ row: row + 1, col: col + 2 });
  allowedMoves.push({ row: row - 2, col: col - 1 });
  allowedMoves.push({ row: row - 2, col: col + 1 });
  allowedMoves.push({ row: row + 2, col: col - 1 });
  allowedMoves.push({ row: row + 2, col: col + 1 });
  return allowedMoves.filter(
    ({ row, col }) => row >= 0 && row <= 3 && col >= 0 && col <= 3
  ).filter(({ row, col }) => board.chessBoard[row][col] !== 'visited');
};

export const markVisitedFields = (board, knightPosition) => {
  board.chessBoard[knightPosition.row][knightPosition.col] = 'visited';
};
