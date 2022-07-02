'use strict';

import { last, range, sample } from 'lodash-es';

export const generateNewBoard = () => ({
  chessBoard: ['rook', ...Array(63).fill(null)],
  rookPosition: { row: 0, col: 0 }
});

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const aiMove = getOptimalAiMove(board);
  return getGameStateAfterMove(board, aiMove);
};

export const getGameStateAfterMove = (board, { row, col }) => {
  markVisitedFields(board, board.rookPosition, { row, col });

  board.chessBoard[row * 8 + col] = 'rook';
  board.rookPosition = { row, col };

  return { board, isGameEnd: getAllowedMoves(board).length === 0 };
};

const getOptimalAiMove = (board) => {
  const { row, col } = board.rookPosition;

  const allowedMoves = [];
  let i = 1;
  while (col - i >= 0 && board.chessBoard[row * 8 + col - i] === null) {
    allowedMoves.push({ row, col: col - i });
    i += 1;
  }
  i = 1;
  while (col + i <= 7 && board.chessBoard[row * 8 + col + i] === null) {
    allowedMoves.push({ row, col: col + i });
    i += 1;
  }
  if (allowedMoves.length >= 1) return last(allowedMoves);

  i = 1;
  while (row - i >= 0 && board.chessBoard[(row - i) * 8 + col] === null) {
    allowedMoves.push({ row: row - i, col });
    i += 1;
  }
  i = 1;
  while (row + i <= 7 && board.chessBoard[(row + i) * 8 + col] === null) {
    allowedMoves.push({ row: row + i, col });
    i += 1;
  }
  return sample(allowedMoves);
};

export const getAllowedMoves = (board) => {
  const { row, col } = board.rookPosition;

  const allowedMoves = [];
  let i = 1;
  while (row - i >= 0 && board.chessBoard[(row - i) * 8 + col] === null) {
    allowedMoves.push({ row: row - i, col });
    i += 1;
  }
  i = 1;
  while (row + i <= 7 && board.chessBoard[(row + i) * 8 + col] === null) {
    allowedMoves.push({ row: row + i, col });
    i += 1;
  }
  i = 1;
  while (col - i >= 0 && board.chessBoard[row * 8 + col - i] === null) {
    allowedMoves.push({ row, col: col - i });
    i += 1;
  }
  i = 1;
  while (col + i <= 7 && board.chessBoard[row * 8 + col + i] === null) {
    allowedMoves.push({ row, col: col + i });
    i += 1;
  }
  return allowedMoves;
};

const markVisitedFields = (board, rookPosition, newRookPosition) => {
  if (rookPosition.row === newRookPosition.row) {
    range(rookPosition.col, newRookPosition.col).forEach(col => {
      board.chessBoard[rookPosition.row * 8 + col] = 'visited';
    });
  }
  if (rookPosition.col === newRookPosition.col) {
    range(rookPosition.row, newRookPosition.row).forEach(row => {
      board.chessBoard[row * 8 + rookPosition.col] = 'visited';
    });
  }
};