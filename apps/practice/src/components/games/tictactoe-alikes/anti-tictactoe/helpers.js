'use strict';

import { some, range, groupBy } from 'lodash';
import { hasWinningSubset } from '../helpers';

export const roleColors = ['red', 'blue'];

export const botColor = chosenRoleIndex => chosenRoleIndex === 0 ? roleColors[1] : roleColors[0];

export const isGameEnd = (board) => {
  if (board.filter(c => c).length === 9) return true;
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

export const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;
  if (board.filter(c => c).length === 9) {
    return !hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[0]));
  }
  return board.filter(c => c).length % 2 === 0;
};
