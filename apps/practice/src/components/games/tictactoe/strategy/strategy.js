'use strict';

import { findIndex, isNull, some, difference, groupBy, range, cloneDeep, isEqual, sample } from 'lodash-es';

export const generateNewBoard = () => (range(0, 9).map(() => null));

export const getGameStateAfterAiMove = (board) => {
  if (inPlacingPhase(board)) {
    board[getOptimalAiPlacingPosition(board)] = 'red';
  } else {
    board[getOptimalAiFlippingPosition(board)] = 'purple';
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board) };
};

export const isTheLastMoverTheWinner = true;

export const inPlacingPhase = (board) => freePlaces(board).length > 0;

const freePlaces = (board) => range(0, 9).filter((i) => isNull(board[i]));
const playerPlaces = (board) => range(0, 9).filter((i) => board[i] === 'blue');
const occupiedPlaces = (board) => range(0, 9).filter((i) => board[i]);

const isGameEnd = (board) => {
  const boardIndicesByPieceColor = groupBy(occupiedPlaces(board), (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

const hasWinningSubset = (indices) => {
  return some(winningIndexSets.map((winningSet) => difference(winningSet, indices).length === 0));
};

const winningIndexSets = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const getOptimalAiPlacingPosition = (board) => {
  const instantWinningPlace = freePlaces(board).find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'red';
    return isGameEnd(localBoard);
  });
  if (instantWinningPlace) return instantWinningPlace;

  const instantDefendingPlace = freePlaces(board).find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'blue';
    return isGameEnd(localBoard);
  });
  if (instantDefendingPlace) return instantDefendingPlace;

  if (isNull(board[4])) return 4;
  if (isNull(board[0])) return 0;
  if (isNull(board[2])) return 2;

  return findIndex(board, isNull);
};

const getOptimalAiFlippingPosition = (board) => {
  const allowedPlaces = playerPlaces(board);

  const instantWinningPlace = allowedPlaces.find((i) => {
    const localBoard = cloneDeep(board);
    localBoard[i] = 'purple';
    return isGameEnd(localBoard);
  });
  if (instantWinningPlace) return instantWinningPlace;

  if (board[4] === 'blue') return 4;


  if (isEqual(allowedPlaces, [1, 3, 5, 6, 8])) return 3;
  if (isEqual(allowedPlaces, [1, 2, 3, 6, 8])) return 2;

  return sample(allowedPlaces);
};
