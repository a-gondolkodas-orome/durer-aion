'use strict';

import { cloneDeep, last } from "lodash";

export const moves = {
  defend: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    nextBoard.bacteria[row][col] -= 1;
    events.endTurn();

    if (areAllBacteriaRemoved(nextBoard.bacteria)) {
      events.endGame();
    }

    return { nextBoard };
  },
  shiftRight: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    const reachedFields = [[row, col + 1]];
    nextBoard.bacteria = makeShiftOrSpread(nextBoard.bacteria, row, col, reachedFields);
    events.endTurn();

    const goalsReached = reachedFields.filter(([row, col]) => isGoal(board, row, col));
    if (goalsReached.length >= 1) {
      events.endGame();
    }

    return { nextBoard };
  },
  shiftLeft: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    const reachedFields = [[row, col - 1]];
    nextBoard.bacteria = makeShiftOrSpread(nextBoard.bacteria, row, col, reachedFields);
    events.endTurn();

    const goalsReached = reachedFields.filter(([row, col]) => isGoal(board, row, col));
    if (goalsReached.length >= 1) {
      events.endGame();
    }

    return { nextBoard };
  },
  jump: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    nextBoard.bacteria = makeJump(nextBoard.bacteria, row, col);
    events.endTurn();

    const reachedFields = [[row + 2, col]];
    const goalsReached = reachedFields.filter(([row, col]) => isGoal(board, row, col));
    if (goalsReached.length >= 1) {
      events.endGame();
    }

    return { nextBoard };
  },
  spread: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    const reachedFields = reachedFieldsWithSpread(
      { bacteria: nextBoard.bacteria, attackRow: row, attackCol: col }
    );
    nextBoard.bacteria = makeShiftOrSpread(nextBoard.bacteria, row, col, reachedFields);
    events.endTurn();

    const goalsReached = reachedFields.filter(([row, col]) => isGoal(board, row, col));
    if (goalsReached.length >= 1) {
      events.endGame();
    }

    return { nextBoard };
  }
};

const reachedFieldsWithSpread = ({ bacteria, attackRow, attackCol }) => {
  return [
    [attackRow + 1, attackCol],
    [attackRow + 1, attackCol + (-1) ** (1 + attackRow)]
  ].filter(([row, col]) => bacteria[row][col] !== undefined);
};

export const isShiftRight = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol + 1));
};

export const isShiftLeft = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol - 1));
};

export const isSpread = ({ attackRow, attackCol, row, col }) => {
  return (
    row === attackRow + 1 &&
    (col === attackCol || col === attackCol + (-1) ** (1 + attackRow))
  );
};

export const isJump = ({ attackRow, attackCol, row, col }) => {
  return row === attackRow + 2 && col === attackCol;
};

export const isAllowedAttackClick = (attack) => {
  return (
    isShiftRight(attack) || isShiftLeft(attack) || isSpread(attack) || isJump(attack)
  );
};

const areAllBacteriaRemoved = (bacteria) => {
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

const makeJump = (bacteria, attackRow, attackCol) => {
  const nextBacteria = cloneDeep(bacteria);
  nextBacteria[attackRow][attackCol] -= 1;
  nextBacteria[attackRow + 2][attackCol] += 1;
  return nextBacteria;
};

const makeShiftOrSpread = (bacteria, attackRow, attackCol, reachedFields) => {
  const nextBacteria = cloneDeep(bacteria);
  nextBacteria[attackRow][attackCol] = 0;
  reachedFields.forEach(([row, col]) => {
    nextBacteria[row][col] += bacteria[attackRow][attackCol];
  });
  return nextBacteria;
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

export const isOddEdge = (bacteria, { row, col }) =>
  (col === 0 || col === lastCol(bacteria, row)) && row % 2 === 0;
