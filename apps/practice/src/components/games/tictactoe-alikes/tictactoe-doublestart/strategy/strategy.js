'use strict';

import { isNull, range, sample, cloneDeep } from 'lodash-es';
import { generateEmptyTicTacToeBoard, hasWinningSubset } from '../../helpers';

export const generateNewBoard = generateEmptyTicTacToeBoard;

const roleColors = ['red', 'blue'];

export const playerColor = isPlayerTheFirstToMove => isPlayerTheFirstToMove ? roleColors[0] : roleColors[1];
const aiColor = isPlayerTheFirstToMove => isPlayerTheFirstToMove ? roleColors[1] : roleColors[0];


export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  if (board.filter(c => c).length === 0) {
    // choose two neighboring corners randomly
    const firstStep = sample([[0, 2], [2, 8], [6, 8], [0, 6]]);
    board[firstStep[0]] = roleColors[0];
    board[firstStep[1]] = roleColors[0];
  } else {
    board[getOptimalAiPlacingPosition(board, isPlayerTheFirstToMove)] = aiColor(isPlayerTheFirstToMove);
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board), hasFirstPlayerWon: hasFirstPlayerWon(board) };
};

export const isTheLastMoverTheWinner = null;

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;

  return hasWinningSubsetForPlayer(board, 0) && !hasWinningSubsetForPlayer(board, 1);
};

const isGameEnd = (board) => board.filter(c => c).length === 9 || hasWinningSubsetForPlayer(board, 1);
const hasWinningSubsetForPlayer = (board, roleIndex) =>
  hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[roleIndex]));

export const getOptimalAiPlacingPosition = (board, isPlayerTheFirstToMove) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = aiColor(isPlayerTheFirstToMove);
    return isWinningState(boardCopy, !isPlayerTheFirstToMove);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const playerPieces = range(0, 9).filter(i => board[i] === playerColor(isPlayerTheFirstToMove));
  const defendingPlaces = allowedPlaces.filter(i => hasWinningSubset([...playerPieces, i]));
  if (defendingPlaces.length > 0) return sample(defendingPlaces);

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
