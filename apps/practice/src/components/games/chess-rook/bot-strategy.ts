import { last, random, sample } from 'lodash';
import type { StrategyArgs } from '../../game-factory/types';
import { getAllowedMoves, type Board, type Field } from './helpers';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.moveRook(board, sample(getAllowedMoves(board)));
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const botMove = getOptimalSmartBotMove(board);
  moves.moveRook(board, botMove);
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
