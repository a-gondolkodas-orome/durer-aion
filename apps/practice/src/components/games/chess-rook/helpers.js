'use strict';

import { range } from 'lodash';

export const generateStartBoard = () => {
  const board = range(0, 8).map(() => range(0, 8).map(() => null));
  board[0][0] = 'rook';
  return {
    chessBoard: board,
    rookPosition: { row: 0, col: 0 }
  };
};

export const getAllowedMoves = (board) => {
  const { row, col } = board.rookPosition;

  const allowedMoves = [];
  let i = 1;
  while (row - i >= 0 && board.chessBoard[(row - i)][col] === null) {
    allowedMoves.push({ row: row - i, col });
    i += 1;
  }
  i = 1;
  while (row + i <= 7 && board.chessBoard[(row + i)][col] === null) {
    allowedMoves.push({ row: row + i, col });
    i += 1;
  }
  i = 1;
  while (col - i >= 0 && board.chessBoard[row][col - i] === null) {
    allowedMoves.push({ row, col: col - i });
    i += 1;
  }
  i = 1;
  while (col + i <= 7 && board.chessBoard[row][col + i] === null) {
    allowedMoves.push({ row, col: col + i });
    i += 1;
  }
  return allowedMoves;
};

export const markVisitedFields = (board, rookPosition, nextRookPosition) => {
  if (rookPosition.row === nextRookPosition.row) {
    range(rookPosition.col, nextRookPosition.col).forEach(col => {
      board.chessBoard[rookPosition.row][col] = 'visited';
    });
  }
  if (rookPosition.col === nextRookPosition.col) {
    range(rookPosition.row, nextRookPosition.row).forEach(row => {
      board.chessBoard[row][rookPosition.col] = 'visited';
    });
  }
};
