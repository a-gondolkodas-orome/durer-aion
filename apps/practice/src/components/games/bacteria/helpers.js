'use strict';

const reachedFieldsWithAttack = (move, { board, attackRow, attackCol }) => {
  if (move === "shiftRight") return [[attackRow, attackCol + 1]];
  if (move === "shiftLeft") return [[attackRow, attackCol - 1]];
  if (move === "jump") return [[attackRow + 2, attackCol]];
  if (move === "spread") {
    return [
      [attackRow + 1, attackCol],
      [attackRow + 1, attackCol + (-1) ** (1 + attackRow)]
    ].filter(([row, col]) => board[row][col] !== undefined);
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

export const reachedFieldsAfterClick = ({ board, attackRow, attackCol, row, col }) => {
  const attack = { attackRow, attackCol, row, col };
  if (isShiftRight(attack)) return reachedFieldsWithAttack("shiftRight", { board, attackRow, attackCol });
  if (isShiftLeft(attack)) return reachedFieldsWithAttack("shiftLeft", { board, attackRow, attackCol });
  if (isJump(attack)) return reachedFieldsWithAttack("jump", { board, attackRow, attackCol });
  if (isSpread(attack)) return reachedFieldsWithAttack("spread", { board, attackRow, attackCol });
};

export const isAllowedAttackClick = (attack) => {
  return (
    isShiftRight(attack) || isShiftLeft(attack) || isSpread(attack) || isJump(attack)
  );
};

export const areAllBacteriaRemoved = (board) => {
  for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length - 0.5 - 0.5 * (-1) ** row; col++) {
      if (board[row][col] > 0) return false;
      }
  }
  return true;
};
