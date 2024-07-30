'use strict';

import { isNull, some, range, groupBy, sample, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../../helpers';

const roleColors = ['red', 'blue'];

export const playerColor = playerIndex => playerIndex === 0 ? roleColors[0] : roleColors[1];
const aiColor = playerIndex => playerIndex === 0 ? roleColors[1] : roleColors[0];

export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const nextBoard = cloneDeep(board);
  nextBoard[getOptimalAiPlacingPosition(board, playerIndex)] = aiColor(playerIndex);
  return getGameStateAfterMove(nextBoard);
};

export const getGameStateAfterMove = (nextBoard) => {
  return { nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 };
};

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

const getOptimalAiPlacingPosition = (board, playerIndex) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));

  // start with middle place as a first step
  if (allowedPlaces.length === 9) return 4;

  // as a first player, proceed with placing at an empty place symmetrical to player's piece
  if (playerIndex === 1) {
    // pairs symmetric to middle place
    const pairs = [[0, 8], [1, 7], [2, 6], [3, 5], [5, 3], [6, 2],  [7, 1] [8, 0]];
    for (const p of pairs) {
      // first is occupied, second is not from given pair
      if (!isNull(board[p[0]]) && isNull(board[p[1]])) {
        return p[1];
      }
    }
  }

  // as a second player still try to win if first player may not play optimally
  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = aiColor(playerIndex);
    return isWinningState(boardCopy, playerIndex === 1);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const aiPieces = range(0, 9).filter(i => board[i] === aiColor(playerIndex));
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
