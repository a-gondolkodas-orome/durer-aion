'use strict';

import { isNull, range, sample, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../../helpers';

const roleColors = ['red', 'blue'];

export const playerColor = playerIndex => playerIndex === 0 ? roleColors[0] : roleColors[1];
const aiColor = playerIndex => playerIndex === 0 ? roleColors[1] : roleColors[0];


export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const nextBoard = cloneDeep(board);
  if (nextBoard.filter(c => c).length === 0) {
    // choose two neighboring corners randomly
    const firstStep = sample([[0, 2], [2, 8], [6, 8], [0, 6]]);
    nextBoard[firstStep[0]] = roleColors[0];
    nextBoard[firstStep[1]] = roleColors[0];
  } else {
    nextBoard[getOptimalAiPlacingPosition(nextBoard, playerIndex)] = aiColor(playerIndex);
  }
  return getGameStateAfterMove(nextBoard);
};

export const getGameStateAfterMove = (nextBoard) => {
  return { nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 };
};

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;

  return hasWinningSubsetForPlayer(board, 0) && !hasWinningSubsetForPlayer(board, 1);
};

const isGameEnd = (board) => board.filter(c => c).length === 9 || hasWinningSubsetForPlayer(board, 1);
const hasWinningSubsetForPlayer = (board, roleIndex) =>
  hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[roleIndex]));

const getOptimalAiPlacingPosition = (board, playerIndex) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = aiColor(playerIndex);
    return isWinningState(boardCopy, playerIndex === 1);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const playerPieces = range(0, 9).filter(i => board[i] === playerColor(playerIndex));
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
