'use strict';

export const isGameEnd = board => board.submarines[board.shark] >= 1 || board.turn > 15;

export const getWinnerIndex = board => board.submarines[board.shark] >= 1 ? 0 : 1;
