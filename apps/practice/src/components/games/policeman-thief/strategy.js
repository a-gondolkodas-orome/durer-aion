"use strict";

import { cloneDeep, random } from "lodash";

export const neighbours = {
  0: [1, 2, 4],
  1: [0, 3, 5],
  2: [0, 3, 6],
  3: [1, 2, 7],
  4: [0, 5, 6],
  5: [1, 4, 7],
  6: [2, 4, 7],
  7: [3, 5, 6]
};

export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const nextBoard = playerIndex === 0
    ? makeOptimalStepAsSecond(board)
    : makeOptimalStepAsFirst(board);
  return getGameStateAfterMove(nextBoard);
};

export const getGameStateAfterMove = (nextBoard) => {
  return {
    nextBoard,
    isGameEnd: isGameEnd(nextBoard),
    winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1
  };
};

const isGameEnd = (board) => {
  if (board.turnCount === 3) {
    return true;
  } else if (board.thief === board.policemen[0] || board.thief === board.policemen[1]) {
    return true;
  }
  return false;
};

const hasFirstPlayerWon = (board) => {
  return board.turnCount < 4 && board.policemen.includes(board.thief);
};

const makeOptimalStepAsFirst = (board) => {
  const nextBoard = cloneDeep(board);

  //policeman0 Step
  let index0 = board.policemen[0];
  let canWeCatch0 = false;
  for (let i = 0; i < 3; i++) {
    if (neighbours[board.policemen[0]][i] === board.thief) {
      index0 = neighbours[board.policemen[0]][i];
      nextBoard.policemen[0] = index0;
      canWeCatch0 = true;
    } else {
      for (let j = 0; j < 3; j++) {
        if (neighbours[neighbours[board.policemen[0]][i]][j] === board.thief) {
          index0 = neighbours[board.policemen[0]][i];
        }
      }
    }
  }
  if (index0 === board.policemen[0]) {
    index0 = neighbours[board.policemen[0]][random(0, 2)];
  }
  if (!canWeCatch0) {
    nextBoard.policemen[0] = index0;
  }

  //policeman1 Step
  let index1 = board.policemen[1];
  let canWeCatch1 = false;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.policemen[1]][i] === board.thief &&
      index0 !== neighbours[board.policemen[1]][i]
    ) {
      index1 = neighbours[board.policemen[1]][i];
      nextBoard.policemen[1] = index1;
      canWeCatch1 = true;
    } else {
      for (let j = 0; j < 3; j++) {
        if (
          neighbours[neighbours[board.policemen[1]][i]][j] === board.thief &&
          index0 !== neighbours[board.policemen[1]][i]
        ) {
          index1 = neighbours[board.policemen[1]][i];
        }
      }
    }
  }
  if (index1 === board.policemen[1]) {
    while (index1 === index0 || index1 === board.policemen[1]) {
      index1 = neighbours[board.policemen[1]][random(0, 2)];
    }
  }
  if (!canWeCatch1) {
    nextBoard.policemen[1] = index1;
  }
  return nextBoard;
};

const makeOptimalStepAsSecond = (board) => {
  const nextBoard = cloneDeep(board);
  let index = board.thief;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.thief][i] !== board.policemen[0] &&
      neighbours[board.thief][i] !== board.policemen[1]
    ) {
      for (let j = 0; j < 3; j++) {
        const fieldToCheck = neighbours[neighbours[board.thief][i]][j];
        if (fieldToCheck !== board.policemen[0] && fieldToCheck !== board.policemen[1]) {
          index = neighbours[board.thief][i];
        }
      }
    }
  }
  if (index === board.thief) {
    index = neighbours[board.thief][random(0, 2)];
  }
  nextBoard.thief = index;
  return nextBoard;
};
