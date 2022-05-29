'use strict';

import { random } from 'lodash-es';

export const colorBoardOptimally = (board) => {
  const groupScores = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      board[i][j] = nextGroup;
      groupScores[nextGroup] += (1 / 2) ** i;
    }
  }

  return board;
};

export const getOptimalGroupToKill = (board) => {
  if (board[0].length > 0) {
    return board[0][0];
  }

  const groupScores = { blue: 0, red: 0 };
  for (let i = 0; i < board.length; i++) {
    for (const soldier of board[i]) {
      groupScores[soldier] += (1 / 2) ** i;
    }
  }

  return groupScores['blue'] > groupScores['red'] ? 'blue' : 'red';
};
