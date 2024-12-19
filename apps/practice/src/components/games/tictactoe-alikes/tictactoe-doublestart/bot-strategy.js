'use strict';

import { isNull, range, sample, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../helpers';
import { isGameEnd, hasFirstPlayerWon, roleColors } from './helpers';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (board.filter(c => c).length === 0) {
    // choose two neighboring corners randomly
    const firstStep = sample([[0, 2], [2, 8], [6, 8], [0, 6]]);
    const { nextBoard } = moves.placePiece(board, firstStep[0]);
    setTimeout(() => {
      moves.placePiece(nextBoard, firstStep[1]);
    }, 750)
  } else {
    const position = getOptimalAiPlacingPosition(board, ctx.chosenRoleIndex);
    moves.placePiece(board, position);
  }
};

const getOptimalAiPlacingPosition = (board, chosenRoleIndex) => {
  const aiColor = roleColors[1 - chosenRoleIndex];
  const opponentColor = roleColors[chosenRoleIndex];

  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = aiColor;
    return isWinningState(boardCopy, chosenRoleIndex === 1);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const opponentPieces = range(0, 9).filter(i => board[i] === opponentColor);
  const defendingPlaces = allowedPlaces.filter(i => hasWinningSubset([...opponentPieces, i]));
  if (defendingPlaces.length > 0) return sample(defendingPlaces);

  return sample(allowedPlaces);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIFirst) => {
  if (isGameEnd(board)) {
    return amIFirst === hasFirstPlayerWon(board);
  }
  const allowedPlaces = range(0, 9).filter(i => isNull(board[i]));
  const opponentColor = roleColors[amIFirst ? 1 : 0];

  const optimalPlaceForOther = allowedPlaces.find(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = opponentColor;
    return isWinningState(boardCopy, !amIFirst);
  });
  return optimalPlaceForOther === undefined;
};
