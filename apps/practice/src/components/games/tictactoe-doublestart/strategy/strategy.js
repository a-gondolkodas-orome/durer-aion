'use strict';

import {
  last, sortBy, isNull, some, difference, range, intersection, sample, isEqual
} from 'lodash-es';

export const generateNewBoard = () => Array(9).fill(null);

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  if (board.filter(c => c).length === 0) {
    const firstStep = sample([[0, 2], [2, 8], [6, 8], [0, 6]]);
    board[firstStep[0]] = 'red';
    board[firstStep[1]] = 'red';
  } else {
    board[getOptimalAiPlacingPosition(board, isPlayerTheFirstToMove)] = isPlayerTheFirstToMove ? 'blue' : 'red';
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board), hasFirstPlayerWon: hasFirstPlayerWon(board) };
};

export const isTheLastMoverTheWinner = null;

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;

  const hasRedWinningSubset = hasWinningSubset(range(0, 9).filter(i => board[i] === 'red'));
  const hasBlueWinningSubset = hasWinningSubset(range(0, 9).filter(i => board[i] === 'blue'));
  return hasRedWinningSubset && !hasBlueWinningSubset;
};

const isGameEnd = (board) => board.filter(c => c).length === 9 || hasWinningSubsetForSecondPlayer(board);
const hasWinningSubsetForSecondPlayer = (board) => hasWinningSubset(range(0, 9).filter(i => board[i] === 'blue'));

const hasWinningSubset = (indices) => {
  const winningIndexSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return some(winningIndexSets.map((winningSet) => difference(winningSet, indices).length === 0));
};

const coveredIndices = [
  [1, 2, 3, 6, 4, 8],
  [0, 2, 4, 7],
  [0, 1, 5, 8, 4, 6],
  [0, 6, 4, 5],
  [0, 1, 2, 3, 5, 6, 7, 8],
  [3, 4, 2, 8],
  [0, 3, 2, 4, 7, 8],
  [1, 4, 6, 8],
  [9, 4, 2, 5, 6, 7]
];

export const getOptimalAiPlacingPosition = (board, isPlayerTheFirstToMove) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));
  const aiColor = isPlayerTheFirstToMove ? 'blue' : 'red';
  const aiPieces = range(0, 9).filter(i => board[i] === aiColor);
  const playerPieces = range(0, 9).filter(i => board[i] !== aiColor && !isNull(board[i]));

  const instantDefendingPlaces = allowedPlaces.filter(i => hasWinningSubset([...playerPieces, i]));
  const winningSubsetCompleterPlace = allowedPlaces.find(i => hasWinningSubset([...aiPieces, i]));

  if (!isEqual(instantDefendingPlaces, []) && winningSubsetCompleterPlace !== undefined) {
    return isPlayerTheFirstToMove ? winningSubsetCompleterPlace : last(instantDefendingPlaces);
  }
  if (!isEqual(instantDefendingPlaces, [])) {
    const countOfCoveredOwnPieces = i => intersection(aiPieces, coveredIndices[i]).length;
    return last(sortBy(instantDefendingPlaces, countOfCoveredOwnPieces));
  }
  if (winningSubsetCompleterPlace !== undefined) return winningSubsetCompleterPlace;

  if (isNull(board[4])) return 4;

  const countOfCoveredPlayerPieces = i =>
    intersection(playerPieces, coveredIndices[i]).length;

  return last(sortBy(allowedPlaces, countOfCoveredPlayerPieces));
};
