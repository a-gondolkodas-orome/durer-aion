'use strict';

import { isNull, some, difference, range, groupBy, sample, cloneDeep } from 'lodash-es';

export const generateNewBoard = () => Array(9).fill(null);

const roleColors = ['red', 'blue'];

export const playerColor = isPlayerTheFirstToMove => isPlayerTheFirstToMove ? roleColors[0] : roleColors[1];
const aiColor = isPlayerTheFirstToMove => isPlayerTheFirstToMove ? roleColors[1] : roleColors[0];

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  board[getOptimalAiPlacingPosition(board, isPlayerTheFirstToMove)] = aiColor(isPlayerTheFirstToMove);
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board), hasFirstPlayerWon: hasFirstPlayerWon(board) };
};

export const isTheLastMoverTheWinner = null;

const isGameEnd = (board) => {
  if (board.filter(c => c).length === 9) return true;
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;
  if (board.filter(c => c).length === 9) {
    return !hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[0]));
  }
  return board.filter(c => c).length % 2 === 0;
};

const hasWinningSubset = (indices) => {
  const winningIndexSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return some(winningIndexSets.map((winningSet) => difference(winningSet, indices).length === 0));
};

export const getOptimalAiPlacingPosition = (board, isPlayerTheFirstToMove) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));
  const occupiedPlaces = range(0, 9).filter(i => board[i]);
  if (allowedPlaces.length === 9) return 4;

  if (!isPlayerTheFirstToMove) {
    const pairs = [[0, 8], [1, 7], [2, 6], [3, 5]];
    const pair = pairs.find(pair => difference(pair, occupiedPlaces).length === 1);
    if (pair) return difference(pair, occupiedPlaces)[0];
  }

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = aiColor(isPlayerTheFirstToMove);
    return isWinningState(boardCopy, !isPlayerTheFirstToMove);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const aiPieces = range(0, 9).filter(i => board[i] === aiColor(isPlayerTheFirstToMove));
  const notInstantLosingPlaces = allowedPlaces.filter(i => !hasWinningSubset([...aiPieces, i]));
  if (notInstantLosingPlaces.length > 0) return sample(notInstantLosingPlaces);

  return sample(allowedPlaces);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIFirst) => {
  if (isGameEnd(board)) {
    return amIFirst === hasFirstPlayerWon(board);
  }
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));
  const optimalPlaceForOther = allowedPlaces.find(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = roleColors[amIFirst ? 1 : 0];
    return isWinningState(boardCopy, !amIFirst);
  });
  return optimalPlaceForOther === undefined;
};
