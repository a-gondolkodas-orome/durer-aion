'use strict';

import { findIndex, isNull, some, difference, range } from 'lodash-es';

export const generateNewBoard = () => Array(9).fill(null);

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  if (board.filter(c => c).length === 0) {
    board[0] = 'red';
    board[2] = 'red';
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

export const getOptimalAiPlacingPosition = (board, isPlayerTheFirstToMove) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));
  const aiColor = isPlayerTheFirstToMove ? 'blue' : 'red';
  const aiPieces = range(0, 9).filter(i => board[i] === aiColor);
  const playerPieces = range(0, 9).filter(i => board[i] !== aiColor && !isNull(board[i]));

  const instantDefendingPlace = allowedPlaces.find(i => hasWinningSubset([...playerPieces, i]));
  const winningSubsetCompleterPlace = allowedPlaces.find(i => hasWinningSubset([...aiPieces, i]));

  if (instantDefendingPlace !== undefined && winningSubsetCompleterPlace !== undefined) {
    return isPlayerTheFirstToMove ? winningSubsetCompleterPlace : instantDefendingPlace;
  }
  if (instantDefendingPlace !== undefined) return instantDefendingPlace;
  if (winningSubsetCompleterPlace !== undefined) return winningSubsetCompleterPlace;

  if (isNull(board[4])) return 4;

  if (isPlayerTheFirstToMove) {
    if (isNull[board[0]] && !isNull[board[8]]) return 0;
    if (isNull[board[8]] && !isNull[board[0]]) return 8;
    if (isNull[board[1]] && !isNull[board[7]]) return 1;
    if (isNull[board[7]] && !isNull[board[1]]) return 7;
    if (isNull[board[2]] && !isNull[board[6]]) return 2;
    if (isNull[board[6]] && !isNull[board[2]]) return 6;
    if (isNull[board[3]] && !isNull[board[5]]) return 3;
    if (isNull[board[5]] && !isNull[board[3]]) return 5;
  }
  return findIndex(board, isNull);
};
