import type { BotStrategy } from 'strategy-game-factory';
import { random } from 'lodash';
import { type Board, type Moves } from './gameplay';
import { reportUnexpectedState } from '../shared/unexpected-state';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'removeStone', args: [getPileOfRandomAllowedMove(board, ctx)] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (board.leftRestriction[ctx.currentPlayer!]) {
    return { move: 'removeStone', args: [1] };
  }
  const optimalMove = getOptimalMove(board, ctx);
  const botMove = optimalMove !== undefined
    ? optimalMove
    : getPileOfRandomAllowedMove(board, ctx);
  return { move: 'removeStone', args: [botMove] };
};

// smartBotStrategy answers a left-restricted mover before ever consulting the
// search, and the one recursive call below hands the restriction to the mover
// only in an odd-odd position, which neither branch guarded by this message
// can reach. So a restricted mover here means the caller or the recursion is
// wrong, not that the game produced the position.
const restrictedMoverMessage =
  'stones-remove-one-not-twice-from-left: the mover is left-restricted in getOptimalMove';

// return undefined if there is no winning move
const getOptimalMove = (board, ctx) => {
  const otherPlayer = 1 - ctx.currentPlayer;
  const parity = [board.piles[0] % 2 === 0, board.piles[1] % 2 === 0]

  if (parity[0] && parity[1]) {
    if (!board.leftRestriction[otherPlayer]) {
      return undefined;
    } else if (board.leftRestriction[ctx.currentPlayer]) {
      reportUnexpectedState(restrictedMoverMessage);
      return undefined;
    } else {
      /*
      If we take right, the other must take right, then we are in an even-even
      position without any restriction which is a losing position. Check winning
      move in next round if we take left (and the other must take right). If
      there is a winning move next round it means taking from left now is also a
      winning move. Otherwise we do not have a winning move.
      */
      const nextRestriction = [false, false];
      nextRestriction[ctx.currentPlayer] = true;
      nextRestriction[1 -ctx.currentPlayer] = false;
      const nextBoard = {
        piles: [board.piles[0] - 1, board.piles[1] - 1],
        leftRestriction: nextRestriction
      }
      const optimalMoveInNextRound = getOptimalMove(nextBoard, ctx);
      return optimalMoveInNextRound !== undefined ? 0 : undefined;
    }
  }
  if (parity[0] && !parity[1]) {
    return 1;
  }
  if (!parity[0] && !parity[1]) {
    if (board.piles[0] > board.piles[1]) {
      return 1;
    } else {
      return undefined;
    }
  }
  if (!parity[0] && parity[1]) {
    if (board.piles[0] <= (board.piles[0] + 1)) {
      if (!board.leftRestriction[ctx.currentPlayer]) {
        return 0;
      } else {
        reportUnexpectedState(restrictedMoverMessage);
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // we should not reach this branch;
  return undefined;
}

const getPileOfRandomAllowedMove = (board, ctx) => {
  if (board.piles[0] === 0) return 1;
  if (board.piles[1] === 0) return 0;
  if (board.leftRestriction[ctx.currentPlayer]) return 1;
  return random(0, 1);
}
