import { random } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { SULTAN, type Board, type SoldierColor, type Soldier, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === SULTAN) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    return { move: 'killGroup', args: [optimalGroupToKill] };
  } else {
    // Separating the soldiers and closing the separation is one decision.
    return [
      { move: 'setGroupOfSoldiers', args: [getOptimalSoldierGroups(board)] },
      { move: 'finalizeSeparation' }
    ];
  }
};

export const getOptimalSoldierGroups = (board: Board): Soldier[] => {
  const groupScores: Record<SoldierColor, number> = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';
  const soldierGroups: Soldier[] = [];

  for (let i = 1; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      soldierGroups.push({ rowIndex: i, pieceIndex: j, group: nextGroup });
      groupScores[nextGroup] += (1 / 2) ** (i - 1);
    }
  }

  return soldierGroups;
};

export const getOptimalGroupToKill = (board: Board): SoldierColor => {
  if (board[1].length > 0) {
    return board[1][0];
  }

  const groupScores: Record<SoldierColor, number> = { blue: 0, red: 0 };
  for (let i = 1; i < board.length; i++) {
    for (const soldier of board[i]) {
      groupScores[soldier] += (1 / 2) ** (i - 1);
    }
  }

  return groupScores['blue'] > groupScores['red'] ? 'blue' : 'red';
};
