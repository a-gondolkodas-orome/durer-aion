'use strict';

import { flatMap, range, sample, cloneDeep } from 'lodash-es';

export const generateNewBoard = () => Array(64).fill(null);
export const BISHOP = 1;
export const FORBIDDEN = 2;

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const aiMove = getOptimalAiMove(board);
  return getGameStateAfterMove(board, aiMove);
};

export const getGameStateAfterMove = (board, { row, col }) => {
  markForbiddenFields(board, { row, col });

  board[row * 8 + col] = BISHOP;

  return { board, isGameEnd: getAllowedMoves(board).length === 0 };
};

const getOptimalAiMove = (board) => {
  // TODO: there are two possible axis!!
  const allowedMirrorMoves = flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })))
    .filter(({ row, col }) => board[row * 8 + col] === null && board[row * 8 + 7 - col] === BISHOP);

  // we are playing according to optimal winning strategy
  if (allowedMirrorMoves.length === 1) return allowedMirrorMoves[0];

  const allowedMoves = getAllowedMoves(board);
  // make a random move if player has played optimally so far
  if (allowedMirrorMoves.length === 0) return sample(allowedMoves);

  // try to win from bad position if player does not play optimally
  // following optimal strategy at the second step seems to slow
  if (board.filter(b => b === BISHOP).length >= 4) {
    const optimalPlaces = allowedMoves.filter(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row * 8 + col] = BISHOP;
      return isWinningState(boardCopy, false);
    });


    if (optimalPlaces.length > 0) {
      return sample(optimalPlaces);
    }
  }
  return sample(allowedMoves);
};

export const getAllowedMoves = (board) => {
  return flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })))
    .filter(({ row, col }) => board[row * 8 + col] === null);
};

const markForbiddenFields = (board, { row, col }) => {
  range(0, 8).forEach(i => {
    if (row - i >= 0 && col - i >= 0) {
      board[(row - i) * 8 + col - i] = FORBIDDEN;
    }
    if (row + i <= 7 && col + i <= 7) {
      board[(row + i) * 8 + col + i] = FORBIDDEN;
    }
    if (row + i <= 7 && col - i >= 0) {
      board[(row + i) * 8 + col - i] = FORBIDDEN;
    }
    if (row - i >= 0 && col + i <= 7) {
      board[(row - i) * 8 + col + i] = FORBIDDEN;
    }
  });
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIPlayer) => {
  if (getAllowedMoves(board).length === 0) {
    return true;
  }

  const allowedPlacesForOther = getAllowedMoves(board);

  const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row * 8 + col] = BISHOP;
    return isWinningState(boardCopy, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};
