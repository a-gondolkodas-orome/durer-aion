'use strict';

export const getGameStateAfterMove = (nextBoard) => {
  return {
    nextBoard,
    isGameEnd: nextBoard.submarines[nextBoard.shark] >= 1 || nextBoard.turn > 11,
    winnerIndex: nextBoard.submarines[nextBoard.shark] >= 1 ? 0 : 1
  };
};

export const isGameEnd = board => board.submarines[board.shark] >= 1 || board.turn > 11;

export const getWinnerIndex = board => board.submarines[board.shark] >= 1 ? 0 : 1;
