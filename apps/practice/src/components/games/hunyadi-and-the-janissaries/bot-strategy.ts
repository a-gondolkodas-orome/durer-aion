import { random } from 'lodash';
import type { StrategyArgs } from '../../game-factory/types';
import { type Board, type SoldierColor, type Soldier } from './helpers';

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  if (ctx.chosenRoleIndex === 0) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    moves.killGroup(board, optimalGroupToKill);
  } else {
    const soldiers = getOptimalSoldierGroups(board);
    const { nextBoard } = moves.setGroupOfSoldiers(board, soldiers);
    moves.finalizeSeparation(nextBoard);
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
