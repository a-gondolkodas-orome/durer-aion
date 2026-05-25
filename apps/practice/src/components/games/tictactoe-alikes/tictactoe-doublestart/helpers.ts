import { range } from 'lodash';
import { hasWinningSubset, type Board } from '../helpers';

export type { Board };

export const roleColors = ['red', 'blue'];

export const hasFirstPlayerWon = (board: Board) => {
  if (!isGameEnd(board)) return undefined;

  return hasWinningSubsetForPlayer(board, 0) && !hasWinningSubsetForPlayer(board, 1);
};

export const isGameEnd = (board: Board) =>
  board.filter(c => c).length === 9 || hasWinningSubsetForPlayer(board, 1);

const hasWinningSubsetForPlayer = (board: Board, roleIndex) =>
  hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[roleIndex]));
