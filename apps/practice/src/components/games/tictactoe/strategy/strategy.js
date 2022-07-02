'use strict';

import { findIndex, isNull, some, difference, groupBy, range, cloneDeep, isEqual, sample } from 'lodash-es';

export const generateNewBoard = () => Array(9).fill(null);

export const getGameStateAfterAiMove = (board) => {
  if (inPlacingPhase(board)) {
    board[getOptimalAiPlacingPosition(board)] = 'red';
  } else {
    board[getOptimalAiFlippingPosition(board)] = 'white';
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board) };
};

export const isTheLastMoverTheWinner = true;

export const inPlacingPhase = (board) => board.find(isNull) !== undefined;

const isGameEnd = (board) => {
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

const hasWinningSubset = (indices) => {
  const winningIndexSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return some(winningIndexSets.map((winningSet) => difference(winningSet, indices).length === 0));
};

export const getOptimalAiPlacingPosition = (board) => {
  const allowedPlaces = range(0, 9).filter((i) => isNull(board[i]));

  const instantWinningPlace = allowedPlaces.find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'red';
    return isGameEnd(localBoard);
  });
  if (instantWinningPlace !== undefined) return instantWinningPlace;

  const instantDefendingPlace = allowedPlaces.find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'blue';
    return isGameEnd(localBoard);
  });
  if (instantDefendingPlace) return instantDefendingPlace;

  if (allowedPlaces.length !== 9 && isNull(board[4])) return 4;
  if (isNull(board[0])) return 0;
  if (isNull(board[2])) return 2;

  return findIndex(board, isNull);
};

export const getOptimalAiFlippingPosition = (board) => {
  const allowedPlaces = range(0, 9).filter((i) => board[i] === 'blue');

  const instantWinningPlace = allowedPlaces.find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'white';
    return isGameEnd(localBoard);
  });
  if (instantWinningPlace) return instantWinningPlace;

  if (board[4] === 'blue') return 4;

  // TODO consider refactoring with game tree simulation

  if (isEqual(allowedPlaces, [1, 3, 5, 6, 8])) return 3;
  if (isEqual(allowedPlaces, [0, 1, 5, 6, 7])) return 1;
  if (isEqual(allowedPlaces, [0, 2, 3, 5, 7])) return 5;
  if (isEqual(allowedPlaces, [1, 2, 3, 7, 8])) return 7;

  if (isEqual(allowedPlaces, [1, 5, 6, 8])) return 8;
  if (isEqual(allowedPlaces, [0, 5, 6, 7])) return 6;
  if (isEqual(allowedPlaces, [0, 2, 3, 7])) return 0;
  if (isEqual(allowedPlaces, [1, 2, 3, 8])) return 2;

  if (isEqual(allowedPlaces, [1, 2, 3, 6, 8])) return 2;
  if (isEqual(allowedPlaces, [0, 1, 5, 6, 8])) return 8;
  if (isEqual(allowedPlaces, [0, 2, 5, 6, 7])) return 6;
  if (isEqual(allowedPlaces, [0, 2, 3, 7, 8])) return 0;

  if (isEqual(allowedPlaces, [1, 3, 6, 8])) return 3;
  if (isEqual(allowedPlaces, [0, 1, 5, 6])) return 1;
  if (isEqual(allowedPlaces, [0, 2, 5, 7])) return 5;
  if (isEqual(allowedPlaces, [2, 3, 7, 8])) return 7;

  // fallback, should not happen
  return sample(allowedPlaces);
};
