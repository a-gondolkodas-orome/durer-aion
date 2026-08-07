import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { getAllowedMoves, type Board, type Field, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'moveKnight', args: [sample(getAllowedMoves(board))!] });

export const smartBotStrategy: Bot = ({ board }) => {
  const allowedMoves = getAllowedMoves(board);

  if (allowedMoves.length === 1) {
    return { move: 'moveKnight', args: [allowedMoves[0]] };
  }
  if (isCenter(board.knightPosition)) {
    const cornerMove = allowedMoves.find(move => isCorner(move));
    if (cornerMove !== undefined) {
      return { move: 'moveKnight', args: [cornerMove] };
    }
  }
  if (isEdgeMiddle(board.knightPosition)) {
    const moveOnEdgeCircle = allowedMoves.find(move => isEdgeMiddle(move));
    if (moveOnEdgeCircle !== undefined) {
      return { move: 'moveKnight', args: [moveOnEdgeCircle] };
    }
  }
  return { move: 'moveKnight', args: [sample(allowedMoves)!] };
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
