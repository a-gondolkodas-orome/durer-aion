import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { getAllowedMoves, type Board, type Field } from './helpers';
import type { moves } from './chess-knight';

type Bot = BotStrategy<Board, keyof typeof moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'moveKnight', args: [sample(getAllowedMoves(board))] });

export const smartBotStrategy: Bot = ({ board }) => {
  const botMove = getOptimalSmartBotMove(board);
  return { move: 'moveKnight', args: [botMove] };
};

export const getOptimalSmartBotMove = (board: Board): Field => {
  const allowedMoves = getAllowedMoves(board);
  if (allowedMoves.length === 1) {
    return allowedMoves[0];
  }
  if (isCenter(board.knightPosition)) {
    const cornerMove = allowedMoves.find(move => isCorner(move));
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
  return sample(allowedMoves)!;
};

const isCenter = ({ row, col }: Field): boolean => {
  return row >= 1 && row <= 2 && col >= 1 && col <= 2;
};

const isCorner = ({ row, col }: Field): boolean => {
  return (
    (row === 0 && (col === 0 || col === 3)) ||
    (row === 3 && (col === 0 || col === 3))
  );
};

const isEdgeMiddle = ({ row, col }: Field): boolean => {
  return !isCenter({ row, col }) && !isCorner({ row, col });
};
