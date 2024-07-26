'use strict';

import { cloneDeep, last } from "lodash";

export const reachedFieldsWithAttack = (move, { bacteria, attackRow, attackCol }) => {
  if (move === "shiftRight") return [[attackRow, attackCol + 1]];
  if (move === "shiftLeft") return [[attackRow, attackCol - 1]];
  if (move === "jump") return [[attackRow + 2, attackCol]];
  if (move === "spread") {
    return [
      [attackRow + 1, attackCol],
      [attackRow + 1, attackCol + (-1) ** (1 + attackRow)]
    ].filter(([row, col]) => bacteria[row][col] !== undefined);
  }
  console.error("move not recognized");
};

const isShiftRight = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol + 1));
};

const isShiftLeft = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol - 1));
};

const isSpread = ({ attackRow, attackCol, row, col }) => {
  return (
    row === attackRow + 1 &&
    (col === attackCol || col === attackCol + (-1) ** (1 + attackRow))
  );
};

export const isJump = ({ attackRow, attackCol, row, col }) => {
  return row === attackRow + 2 && col === attackCol;
};

export const reachedFieldsAfterClick = ({ bacteria, attackRow, attackCol, row, col }) => {
  const attack = { attackRow, attackCol, row, col };
  if (isShiftRight(attack)) {
    return reachedFieldsWithAttack("shiftRight", { bacteria, attackRow, attackCol });
  }
  if (isShiftLeft(attack)) {
    return reachedFieldsWithAttack("shiftLeft", { bacteria, attackRow, attackCol });
  }
  if (isJump(attack)) {
    return reachedFieldsWithAttack("jump", { bacteria, attackRow, attackCol });
  }
  if (isSpread(attack)) {
    return reachedFieldsWithAttack("spread", { bacteria, attackRow, attackCol });
  }
};

export const isAllowedAttackClick = (attack) => {
  return (
    isShiftRight(attack) || isShiftLeft(attack) || isSpread(attack) || isJump(attack)
  );
};

export const areAllBacteriaRemoved = (bacteria) => {
  for (let row = 0; row < bacteria.length; row++) {
    for (let col = 0; col <= lastCol(bacteria, row); col++) {
      if (bacteria[row][col] > 0) return false;
    }
  }
  return true;
};

export const isGoal = (board, row, col) => {
  return row === (board.bacteria.length - 1) && board.goals.includes(col);
};

export const lastCol = (bacteria, row) => bacteria[0].length - 0.5 - 0.5 * (-1) ** row;

export const makeJump = (bacteria, attackRow, attackCol) => {
  const newBacteria = cloneDeep(bacteria);
  newBacteria[attackRow][attackCol] -= 1;
  newBacteria[attackRow + 2][attackCol] += 1;
  return newBacteria;
};

export const makeShiftOrSpread = (bacteria, attackRow, attackCol, reachedFields) => {
  const newBacteria = cloneDeep(bacteria);
  newBacteria[attackRow][attackCol] = 0;
  reachedFields.forEach(([row, col]) => {
    newBacteria[row][col] += bacteria[attackRow][attackCol];
  });
  return newBacteria;
};

/* Currently only correct for board with adjacent goals */
export const isDangerous = (board, { row, col }) => {
  return distanceFromDangerousAttackZone(board, { row, col }).dist === 0;
};

export const distanceFromDangerousAttackZone = (board, { row, col }) => {
  const boardWidth = board.bacteria[0].length;
  const goalRowIdx = board.bacteria.length - 1;
  const finalLeft = board.goals[0] === 0 ? 0 : board.goals[0] - 1;
  const leftEdge = finalLeft + Math.floor((goalRowIdx - row)/2);
  const finalRight = last(board.goals) === boardWidth - 1 ? boardWidth - 1 : last(board.goals) + 1;
  const rightEdge = finalRight - Math.ceil((goalRowIdx - row)/2);
  if (board.goals[0] === 0) {
    if (col === 0 && row === (goalRowIdx - 2)) {
      return { dist: 0, dir: "center" };
    }
  }
  if (last(board.goals) === boardWidth - 1) {
    if (col === (boardWidth - 1) && row === (goalRowIdx - 2)) {
      return { dist: 0, dir: "center" };
    }
  }
  if (col >= leftEdge && col <= rightEdge) {
    return { dist: 0, dir: "center" };
  } else if (col < leftEdge) {
    return { dist: leftEdge - col, dir: "left" };
  } else {
    return { dist: col - rightEdge, dir: "right" };
  };
};
