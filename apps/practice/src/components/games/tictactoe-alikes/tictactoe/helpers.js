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

export const currentPlayerColor = (ctx) =>
  ctx.isHumanVsHumanGame
    ? (ctx.currentPlayer === 0 ? 'blue' : 'red')
    : (ctx.currentPlayer === ctx.chosenRoleIndex ? pColor : aiColor);

export const otherPlayerColor = (ctx) =>
  ctx.isHumanVsHumanGame
    ? (ctx.currentPlayer === 0 ? 'red' : 'blue')
    : (ctx.currentPlayer === ctx.chosenRoleIndex ? aiColor : pColor);
