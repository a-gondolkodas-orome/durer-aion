import { range, sample } from 'lodash';
import { isGameEnd, placeStone, type Board } from './helpers';
import type { StrategyArgs } from '../../game-factory';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.placeStone(board, sample(emptyCells(board)));
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const id = getOptimalPlacingPosition(board, ctx.chosenRoleIndex);
  moves.placeStone(board, id);
};

const emptyCells = (board: Board) => range(0, 9).filter(i => !board[i]);

const winnerCache = new Map<string, number>();

// given it is someone's turn at this board (no full line yet), which player wins with optimal play?
const winner = (board: Board, toMove: number): number => {
  const key = board.join('');
  const cached = winnerCache.get(key);
  if (cached !== undefined) return cached;

  const result = emptyCells(board).some(i => {
    const nextBoard = placeStone(board, i);
    const outcome = isGameEnd(nextBoard) ? 1 - toMove : winner(nextBoard, 1 - toMove);
    return outcome === toMove;
  }) ? toMove : 1 - toMove;

  winnerCache.set(key, result);
  return result;
};

export const getOptimalPlacingPosition = (board: Board, chosenRoleIndex) => {
  const allowedPlaces = emptyCells(board);

  const winningPlaces = allowedPlaces.filter(i => {
    const nextBoard = placeStone(board, i);
    const outcome = isGameEnd(nextBoard) ? 1 - chosenRoleIndex : winner(nextBoard, 1 - chosenRoleIndex);
    return outcome === chosenRoleIndex;
  });
  if (winningPlaces.length > 0) return sample(winningPlaces);

  // no winning move exists; at least avoid losing immediately if possible
  const notInstantLosingPlaces = allowedPlaces.filter(i => !isGameEnd(placeStone(board, i)));
  if (notInstantLosingPlaces.length > 0) return sample(notInstantLosingPlaces);

  return sample(allowedPlaces);
};
