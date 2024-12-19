'use strict';

import { isNull, range, sample, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../helpers';
import { roleColors, botColor, hasFirstPlayerWon, isGameEnd } from './helpers';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const id = getOptimalAiPlacingPosition(board, ctx.chosenRoleIndex);
  moves.placePiece(board, id);
};

const getOptimalAiPlacingPosition = (board, chosenRoleIndex) => {
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));

  // start with middle place as a first step
  if (allowedPlaces.length === 9) return 4;

  // as a first player, proceed with placing at an empty place symmetrical to player's piece
  if (chosenRoleIndex === 1) {
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
    boardCopy[i] = botColor(chosenRoleIndex);
    return isWinningState(boardCopy, chosenRoleIndex === 1);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const aiPieces = range(0, 9).filter(i => board[i] === botColor(chosenRoleIndex));
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
