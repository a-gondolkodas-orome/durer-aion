'use strict';

import { last, random } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const aiMove = getOptimalAiMove(board);
  moves.moveRook(board, aiMove);
};

export const getOptimalAiMove = (board) => {
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
