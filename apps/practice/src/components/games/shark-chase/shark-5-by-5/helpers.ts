import type { Board } from './shark-chase';

export const isGameEnd = (board: Board): boolean =>
  board.submarines[board.shark] >= 1 || board.turn > 15;

export const getWinnerIndex = (board: Board): number =>
  board.submarines[board.shark] >= 1 ? 0 : 1;
