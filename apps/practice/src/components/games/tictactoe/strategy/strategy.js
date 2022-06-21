'use strict';

import { findIndex, isNull, compact, flatten } from "lodash-es";

export const generateNewBoard = () => ([null, null, null, null, null, null, null, null, null]);

export const getGameStateAfterAiMove = (board) => {
  if (inPlacingPhase(board)) {
    board[findIndex(board, isNull)] = 'red';
  } else {
    board[findIndex(board, (c) => c === 'blue')] = 'purple';
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board) };
};

export const isTheLastMoverTheWinner = true;

export const inPlacingPhase = (board) => compact(flatten(board)).length !== 9;

const isGameEnd = (board) => {
  return (
    isMatch(board, [0, 1, 2]) ||
    isMatch(board, [3, 4, 5]) ||
    isMatch(board, [6, 7, 8]) ||
    isMatch(board, [0, 3, 6]) ||
    isMatch(board, [1, 4, 7]) ||
    isMatch(board, [2, 5, 8]) ||
    isMatch(board, [0, 4, 8]) ||
    isMatch(board, [2, 4, 6])
  );
};

const isMatch = (board, indices) => {
  return board[indices[0]] && board[indices[0]] === board[indices[1]] && board[indices[1]] === board[indices[2]];
};
