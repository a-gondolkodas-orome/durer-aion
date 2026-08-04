import { last, random, sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { getAllowedMoves, type Board, type Field } from './helpers';
import type { moves } from './chess-rook';

type Bot = BotStrategy<Board, keyof typeof moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'moveRook', args: [sample(getAllowedMoves(board))] });

export const smartBotStrategy: Bot = ({ board }) => {
  const botMove = getOptimalSmartBotMove(board);
  return { move: 'moveRook', args: [botMove] };
};

export const getOptimalSmartBotMove = (board: Board): Field => {
  const { row, col } = board.rookPosition;
  const allMoves = getAllowedMoves(board);
  const allowedHorizontalMoves = allMoves.filter(m => m.row === row);
  const allowedVerticalMoves = allMoves.filter(m => m.col === col);

  if (allowedHorizontalMoves.length < allowedVerticalMoves.length) {
    return last(allowedVerticalMoves)!;
  } else if (allowedHorizontalMoves.length > allowedVerticalMoves.length) {
    return last(allowedHorizontalMoves)!;
  }
  if (random(0, 1) === 1) {
    return last(allowedHorizontalMoves)!;
  } else {
    return last(allowedVerticalMoves)!;
  }
};
