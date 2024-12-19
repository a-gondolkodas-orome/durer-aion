'use strict';

import { isNull, some, groupBy, range } from 'lodash';
import { hasWinningSubset } from '../helpers';

export const isGameEnd = (board) => {
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

export const pColor = 'blue';
export const aiColor = 'red';

export const inPlacingPhase = (board) => board.find(isNull) !== undefined;
