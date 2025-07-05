'use strict';

export const isGameEnd = board => board.submarines[board.shark] >= 1 || board.turn > 11;

export const getWinnerIndex = board => board.submarines[board.shark] >= 1 ? 0 : 1;
