import { last, random, sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { getAllowedMoves, type Board } from './helpers';
import type { Moves } from './chess-rook';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'moveRook', args: [sample(getAllowedMoves(board))!] });

export const smartBotStrategy: Bot = ({ board }) => {
  const { row, col } = board.rookPosition;
  const allMoves = getAllowedMoves(board);
  const allowedHorizontalMoves = allMoves.filter(m => m.row === row);
  const allowedVerticalMoves = allMoves.filter(m => m.col === col);

  if (allowedHorizontalMoves.length < allowedVerticalMoves.length) {
    return { move: 'moveRook', args: [last(allowedVerticalMoves)!] };
  } else if (allowedHorizontalMoves.length > allowedVerticalMoves.length) {
    return { move: 'moveRook', args: [last(allowedHorizontalMoves)!] };
  }
  if (random(0, 1) === 1) {
    return { move: 'moveRook', args: [last(allowedHorizontalMoves)!] };
  } else {
    return { move: 'moveRook', args: [last(allowedVerticalMoves)!] };
  }
};
