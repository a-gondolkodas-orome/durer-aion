import { range } from 'lodash';
import { hasWinningSubset } from '../helpers';

export const roleColors = ['red', 'blue'];

export const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;

  return hasWinningSubsetForPlayer(board, 0) && !hasWinningSubsetForPlayer(board, 1);
};

export const isGameEnd = (board) =>
  board.filter(c => c).length === 9 || hasWinningSubsetForPlayer(board, 1);

const hasWinningSubsetForPlayer = (board, roleIndex) =>
  hasWinningSubset(range(0, 9).filter(i => board[i] === roleColors[roleIndex]));
