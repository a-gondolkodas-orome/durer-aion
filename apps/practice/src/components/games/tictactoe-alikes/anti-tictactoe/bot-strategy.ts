import { range, isNull, sample, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../helpers';
import { roleColors, hasFirstPlayerWon, isGameEnd, type Board } from './helpers';
import type { BotStrategy } from '../../../strategy-game-factory';
import type { Moves } from './anti-tictactoe';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'placePiece', args: [sample(emptyCells(board))!] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const chosenRoleIndex = ctx.chosenRoleIndex!;
  const allowedPlaces = emptyCells(board);

  // start with middle place as a first step
  if (allowedPlaces.length === 9) return { move: 'placePiece', args: [4] };

  // as a first player, proceed with placing at an empty place symmetrical to player's piece
  if (chosenRoleIndex === 1) {
    // pairs symmetric to middle place
    const pairs = [[0, 8], [1, 7], [2, 6], [3, 5], [5, 3], [6, 2], [7, 1], [8, 0]];
    for (const p of pairs) {
      // first is occupied, second is not from given pair
      if (!isNull(board[p[0]]) && isNull(board[p[1]])) {
        return { move: 'placePiece', args: [p[1]] };
      }
    }
  }

  const botColor = roleColors[1 - chosenRoleIndex];

  // as a second player still try to win if first player may not play optimally
  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = botColor;
    return isWinningState(boardCopy, chosenRoleIndex === 1);
  });

  if (optimalPlaces.length > 0) return { move: 'placePiece', args: [sample(optimalPlaces)!] };

  // even if we are gonna lose, try to prolong it
  const aiPieces = range(0, 9).filter(i => board[i] === botColor);
  const notInstantLosingPlaces = allowedPlaces.filter(i => !hasWinningSubset([...aiPieces, i]));
  if (notInstantLosingPlaces.length > 0) {
    return { move: 'placePiece', args: [sample(notInstantLosingPlaces)!] };
  }

  return { move: 'placePiece', args: [sample(allowedPlaces)!] };
};

const emptyCells = (board: Board) => range(0, 9).filter(i => isNull(board[i]));

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIFirst) => {
  if (isGameEnd(board)) {
    return amIFirst === hasFirstPlayerWon(board);
  }
  const optimalPlaceForOther = emptyCells(board).find(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = roleColors[amIFirst ? 1 : 0];
    return isWinningState(boardCopy, !amIFirst);
  });
  return optimalPlaceForOther === undefined;
};
