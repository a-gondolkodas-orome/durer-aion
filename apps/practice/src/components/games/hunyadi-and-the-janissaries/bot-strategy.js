'use strict';

import { random } from 'lodash';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (ctx.chosenRoleIndex === 0) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    const { nextBoard, isGameEnd } = moves.killGroup(board, optimalGroupToKill);
    if (!isGameEnd) {
      setTimeout(() => {
        moves.stepUp(nextBoard);
      }, 750);
    }
  } else {
    const soldiers = getOptimalSoldierGroups(board);
    const { nextBoard } = moves.setGroupOfSoldiers(board, soldiers);
    moves.finalizeSeparation(nextBoard);
  }
};

export const getOptimalSoldierGroups = (board) => {
  const groupScores = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';
  const soldierGroups = [];

  for (let i = 1; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      soldierGroups.push({ rowIndex: i, pieceIndex: j, group: nextGroup });
      groupScores[nextGroup] += (1 / 2) ** (i - 1);
    }
  }

  return soldierGroups;
};

export const getOptimalGroupToKill = (board) => {
  if (board[1].length > 0) {
    return board[1][0];
  }

  const groupScores = { blue: 0, red: 0 };
  for (let i = 1; i < board.length; i++) {
    for (const soldier of board[i]) {
      groupScores[soldier] += (1 / 2) ** (i - 1);
    }
  }

  return groupScores['blue'] > groupScores['red'] ? 'blue' : 'red';
};
