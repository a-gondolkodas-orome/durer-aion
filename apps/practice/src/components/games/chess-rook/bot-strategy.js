'use strict';

import { last, random, sample } from 'lodash';
import { getAllowedMoves } from './helpers';

export const randomBotStrategy = ({ board, moves }) => {
  moves.moveRook(board, sample(getAllowedMoves(board)));
};

export const aiBotStrategy = ({ board, moves }) => {
  const aiMove = getOptimalAiMove(board);
  moves.moveRook(board, aiMove);
};

export const getOptimalAiMove = (board) => {
  const { row, col } = board.rookPosition;
  const allMoves = getAllowedMoves(board);
  const allowedHorizontalMoves = allMoves.filter(m => m.row === row);
  const allowedVerticalMoves = allMoves.filter(m => m.col === col);

  if (allowedHorizontalMoves.length < allowedVerticalMoves.length) {
    return last(allowedVerticalMoves);
  } else if (allowedHorizontalMoves.length > allowedVerticalMoves.length) {
    return last(allowedHorizontalMoves);
  }
  if (random(0, 1) === 1) {
    return last(allowedHorizontalMoves);
  } else {
    return last(allowedVerticalMoves);
  }
};
