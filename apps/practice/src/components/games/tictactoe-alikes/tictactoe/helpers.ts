import { isNull, some, groupBy, range } from 'lodash';
import { hasWinningSubset, type Board } from '../helpers';

export type { Board };

export const isGameEnd = (board: Board) => {
  const occupiedPlaces = range(0, 9).filter((i) => board[i]);
  const boardIndicesByPieceColor = groupBy(occupiedPlaces, (i) => board[i]);
  return some(boardIndicesByPieceColor, hasWinningSubset);
};

export const pColor = 'blue';
export const botColor = 'red';

export const inPlacingPhase = (board: Board) => board.find(isNull) !== undefined;

export const currentPlayerColor = (ctx) =>
  ctx.isHumanVsHumanGame
    ? (ctx.currentPlayer === 0 ? 'blue' : 'red')
    : (ctx.currentPlayer === ctx.chosenRoleIndex ? pColor : botColor);

export const otherPlayerColor = (ctx) =>
  ctx.isHumanVsHumanGame
    ? (ctx.currentPlayer === 0 ? 'red' : 'blue')
    : (ctx.currentPlayer === ctx.chosenRoleIndex ? botColor : pColor);

// Whitening only starts once the board is full, and a player may only whiten one
// of the *other* player's pieces — never an own or an already whitened one. The
// phase check is what stops a player from whitening mid-placement; for placing,
// "the cell is empty" already implies the placing phase, so that move needs no
// phase check of its own.
export const isWhiteningAllowed = (board: Board, ctx, id: number) =>
  !inPlacingPhase(board) && board[id] === otherPlayerColor(ctx);
