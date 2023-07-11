'use strict';

import { last, range, random, cloneDeep } from 'lodash';

export const generateNewBoard = () => {
  const board = range(0, 8).map(() => range(0, 8).map(() => null));
  board[0][0] = 'rook';
  return {
    chessBoard: board,
    rookPosition: { row: 0, col: 0 }
  };
};

export const getGameStateAfterAiTurn = ({ board }) => {
  const aiMove = getOptimalAiMove(board);
  return getGameStateAfterMove(board, aiMove);
};

export const getGameStateAfterMove = (board, { row, col }) => {
  const newBoard = cloneDeep(board);
  markVisitedFields(newBoard, newBoard.rookPosition, { row, col });

  newBoard.chessBoard[row][col] = 'rook';
  newBoard.rookPosition = { row, col };

  return { newBoard, isGameEnd: getAllowedMoves(newBoard).length === 0, winnerIndex: null };
};

const getOptimalAiMove = (board) => {
  const { row, col } = board.rookPosition;

  const allowedHorizontalMoves = [];
  let i = 1;
  while (col - i >= 0 && board.chessBoard[row ][col - i] === null) {
    allowedHorizontalMoves.push({ row, col: col - i });
    i += 1;
  }
  i = 1;
  while (col + i <= 7 && board.chessBoard[row][col + i] === null) {
    allowedHorizontalMoves.push({ row, col: col + i });
    i += 1;
  }

  const allowedVerticalMoves = [];
  i = 1;
  while (row - i >= 0 && board.chessBoard[(row - i)][col] === null) {
    allowedVerticalMoves.push({ row: row - i, col });
    i += 1;
  }
  i = 1;
  while (row + i <= 7 && board.chessBoard[(row + i)][col] === null) {
    allowedVerticalMoves.push({ row: row + i, col });
    i += 1;
  }

  if (allowedHorizontalMoves.length < allowedVerticalMoves.length) {
    return last(allowedVerticalMoves);
  } else if (allowedHorizontalMoves.length > allowedVerticalMoves.length) {
    return last(allowedHorizontalMoves);
  }
  if (random(0, 1) === 1) {
    return last(allowedHorizontalMoves);
  } else {
    return last(allowedVerticalMoves);
  }
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

const markVisitedFields = (board, rookPosition, newRookPosition) => {
  if (rookPosition.row === newRookPosition.row) {
    range(rookPosition.col, newRookPosition.col).forEach(col => {
      board.chessBoard[rookPosition.row][col] = 'visited';
    });
  }
  if (rookPosition.col === newRookPosition.col) {
    range(rookPosition.row, newRookPosition.row).forEach(row => {
      board.chessBoard[row][rookPosition.col] = 'visited';
    });
  }
};
