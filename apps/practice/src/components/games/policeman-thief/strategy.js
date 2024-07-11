"use strict";

import { cloneDeep } from "lodash";

const neighbours = {
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
  let newBoard = { ...board };
  // TODO: instead of using let, make below functions not changing their argument
  newBoard =
    playerIndex === 0
      ? makeOptimalStepAsSecond(newBoard)
      : makeOptimalStepAsFirst(newBoard);
  return getGameStateAfterMove(newBoard);
};

export const getGameStateAfterMove = (newBoard) => {
  const state = {
    newBoard,
    isGameEnd: isGameEnd(newBoard),
    winnerIndex: hasFirstPlayerWon(newBoard) ? 0 : 1
  };
  return state;
};

const isGameEnd = (board) => {
  if (board.turnCount === 3) {
    return true;
  } else if (board.red === board.blue1 || board.red === board.blue2) {
    return true;
  }
  return false;
};

const hasFirstPlayerWon = (board) => {
  if (
    (board.red === board.blue1 || board.red === board.blue2) &&
    board.turnCount < 4
  ) {
    return true;
  }
  return false;
};
const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

const makeOptimalStepAsFirst = (board) => {
  //blue1Step
  let index1 = board.blue1;
  let canWeCatch1 = false;
  let newBoard = cloneDeep(board);
  for (let i = 0; i < 3; i++) {
    if (neighbours[board.blue1][i] === board.red) {
      index1 = neighbours[board.blue1][i];
      let piece1 = { blue1: index1 };
      newBoard = { ...newBoard, ...piece1 };
      canWeCatch1 = true;
    } else {
      for (let j = 0; j < 3; j++) {
        if (neighbours[neighbours[board.blue1][i]][j] === board.red) {
          index1 = neighbours[board.blue1][i];
        }
      }
    }
  }
  if (index1 === board.blue1) {
    index1 = neighbours[board.blue1][getRandomInt(3)];
  }
  if (!canWeCatch1) {
    let piece1 = { blue1: index1 };
    newBoard = { ...newBoard, ...piece1 };
  }

  //blue2Step
  let index2 = board.blue2;
  let canWeCatch2 = false;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.blue2][i] === board.red &&
      index1 !== neighbours[board.blue2][i]
    ) {
      index2 = neighbours[board.blue2][i];
      let piece2 = { blue2: index2 };
      newBoard = { ...newBoard, ...piece2 };
      canWeCatch2 = true;
    } else {
      for (let j = 0; j < 3; j++) {
        if (
          neighbours[neighbours[board.blue2][i]][j] === board.red &&
          index1 !== neighbours[board.blue2][i]
        ) {
          index2 = neighbours[board.blue2][i];
        }
      }
    }
  }
  if (index2 === board.blue2) {
    while (index2 === index1 || index2 === board.blue2) {
      index2 = neighbours[board.blue2][getRandomInt(3)];
    }
  }
  if (!canWeCatch2) {
    let piece2 = { blue2: index2 };
    newBoard = { ...newBoard, ...piece2 };
  }
  return newBoard;
};

const makeOptimalStepAsSecond = (board) => {
  let index = board.red;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.red][i] !== board.blue1 &&
      neighbours[board.red][i] !== board.blue2
    ) {
      for (let j = 0; j < 3; j++) {
        const fieldToCheck = neighbours[neighbours[board.red][i]][j];
        if (fieldToCheck !== board.blue1 && fieldToCheck !== board.blue2) {
          index = neighbours[board.red][i];
        }
      }
    }
  }
  if (index === board.red) {
    index = neighbours[board.red][getRandomInt(3)];
  }
  return { ...cloneDeep(board), red: index };
};
