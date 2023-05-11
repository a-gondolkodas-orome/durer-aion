'use strict';

import { flatMap, range, sample, cloneDeep, random, sampleSize, shuffle } from 'lodash-es';

const HORIZONTAL = "h";
const VERTICAL = "v";
let axis = null;

export const generateNewBoard = () => {
  axis = null;
  return range(0, 8).map(() => range(0, 8).map(() => null));
};

const boardIndices = flatMap(range(0, 8), row => range(0, 8).map(col => ({ row, col })));

export const BISHOP = 1;
export const FORBIDDEN = 2;

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const aiMove = getOptimalAiMove(board);
  return getGameStateAfterMove(board, aiMove);
};

export const getGameStateAfterMove = (board, { row, col }) => {
  markForbiddenFields(board, { row, col });
  board[row][col] = BISHOP;

  return { board, isGameEnd: getAllowedMoves(board).length === 0 };
};

const getOptimalAiMove = (board) => {
  const allowedHMirrorMoves = boardIndices.filter(
    ({ row, col }) => board[row][col] === null && board[row][7 - col] === BISHOP
  );
  const allowedVMirrorMoves = boardIndices.filter(
    ({ row, col }) => board[row][col] === null && board[7 - row][col] === BISHOP
  );

  const bishopCount = boardIndices.filter(({ row, col }) => board[row][col] === BISHOP).length;
  // we are playing according to optimal winning strategy
  // as a first step, choose a mirror axis randomly
  if (bishopCount === 1) {
    axis = random(0, 1) ? HORIZONTAL : VERTICAL;
  }
  // identify player's axis if they are playing optimally in their first step
  if (bishopCount === 2) {
    if (allowedHMirrorMoves.length === 0) {
      axis = HORIZONTAL;
    }
    if (allowedVMirrorMoves.length === 0) {
      axis = VERTICAL;
    }
  }

  if (axis === HORIZONTAL && allowedHMirrorMoves.length === 1) {
    return allowedHMirrorMoves[0];
  }
  if (axis === VERTICAL && allowedVMirrorMoves.length === 1) {
    return allowedVMirrorMoves[0];
  }

  const allowedMoves = getAllowedMoves(board);

  // try to win from bad position if player does not play optimally
  // following optimal strategy at the second step seems too slow
  // so we try a few places with hopes they are optimal
  if (bishopCount === 2) {
    const optimalPlace = sampleSize(allowedMoves, 2).find(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row][col] = BISHOP;
      return isWinningState(boardCopy, false);
    });


    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }

  // try to win from bad position if player does not play optimally
  if (bishopCount >= 4) {
    // sample + find has the same effect as filter + sample: find a random
    // from the optimal moves
    const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row][col] = BISHOP;
      return isWinningState(boardCopy, false);
    });


    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }
  return sample(allowedMoves);
};

export const getAllowedMoves = (board) => {
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

const markForbiddenFields = (board, { row, col }) => {
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

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIPlayer) => {
  if (getAllowedMoves(board).length === 0) {
    return true;
  }

  const allowedPlacesForOther = getAllowedMoves(board);

  const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row][col] = BISHOP;
    return isWinningState(boardCopy, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};
