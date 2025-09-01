'use strict';

import { sample } from 'lodash';
import { getAllowedMoves } from './helpers';

export const aiBotStrategy = ({ board, moves }) => {
  const aiMove = getOptimalAiMove(board);
  moves.moveKnight(board, aiMove);
};

export const getOptimalAiMove = (board) => {
  const allowedMoves = getAllowedMoves(board);
  if (allowedMoves.length === 1) {
    return allowedMoves[0];
  }
  if (isCenter(board.knightPosition)) {
    const cornerMove  = allowedMoves.find(move => isCorner(move));
    if (cornerMove !== undefined) {
      return cornerMove;
    }
  }
  if (isEdgeMiddle(board.knightPosition)) {
    const moveOnEdgeCircle = allowedMoves.find(move => isEdgeMiddle(move));
    if (moveOnEdgeCircle !== undefined) {
      return moveOnEdgeCircle;
    }
  }
  return sample(allowedMoves);
};

const isCenter = ({ row, col }) => {
  return row >= 1 && row <= 2 && col >= 1 && col <= 2;
}

const isCorner = ({ row, col }) => {
  return (
    (row === 0 && (col === 0 || col === 3)) ||
    (row === 3 && (col === 0 || col === 3))
  );
}

const isEdgeMiddle = ({ row, col }) => {
  return !isCenter({ row, col }) && !isCorner({ row, col });
}
