'use strict';

import { isNull, some, difference, range, groupBy, sample } from 'lodash-es';

export const generateNewBoard = () => Array(9).fill(null);

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  board[getOptimalAiPlacingPosition(board, isPlayerTheFirstToMove)] = isPlayerTheFirstToMove ? 'blue' : 'red';
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
    return !hasWinningSubset(range(0, 9).filter(i => board[i] === 'red'));
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

  const pairs = [[0, 8], [1, 7], [2, 6], [3, 5]];
  const pair = pairs.find(pair => difference(pair, occupiedPlaces).length === 1);
  if (pair) return difference(pair, occupiedPlaces)[0];

  const aiColor = isPlayerTheFirstToMove ? 'blue' : 'red';
  const aiPieces = range(0, 9).filter(i => board[i] === aiColor);

  const notInstantLosingPlaces = allowedPlaces.filter(i => !hasWinningSubset([...aiPieces, i]));
  if (notInstantLosingPlaces.length > 0) return sample(notInstantLosingPlaces);

  return sample(allowedPlaces);
};
