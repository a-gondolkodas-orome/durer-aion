'use strict';

import { findIndex, isNull, some, difference, groupBy, range, cloneDeep, isEqual, sample } from 'lodash-es';

//export const generateNewBoard = () => Array(9).fill(null);
export const generateNewBoard = () => {
  return { 
    usedColors: ["red", "green", "blue"], 
    colors: Array(8).fill("white"), 
    neighbours: {
      0: [1, 3, 4],
      1: [0, 2, 5],
      2: [1, 3, 4, 6],
      3: [0, 2, 7],
      4: [0, 2, 5, 7],
      5: [1, 4, 6],
      6: [2, 5, 7],
      7: [3, 4, 6]
    }
  };
};

export const getGameStateAfterAiMove = (board) => {
  board = makeOptimalStep(board);
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  let hasFirstPlayerWon = !hasEmptyVertex(board);
  return { board, isGameEnd: isGameEnd(board), hasFirstPlayerWon};
};

export const isTheLastMoverTheWinner = null;

export const hasNeighbourWithSameColor = (board, vertex, color) => {
  for (let v of board.neighbours[vertex]) {
    if (board.colors[v] === color) return true;
  }
  return false;
};

export const isAllowedStep = (board, vertex, color) => {
  return !hasNeighbourWithSameColor(board, vertex, color) && isEmptyVertex(board, vertex);
};

export const existsAllowedStep = (board) => {
  for (let color of board.usedColors) {
    for (let vertex in board.colors) {
      if (isAllowedStep(board, vertex, color)) return true;
    }
  }
  return false;
};

const makeOptimalStep = (board) => {
  for (let color of board.usedColors) {
    if (isAllowedStep(board, 2, color)) {
      board.colors[2] = color;
      return board;
    }
    if (isAllowedStep(board, 4, color)) {
      board.colors[4] = color;
      return board;
    }
  }
  for (let color of board.usedColors) {
    for (let vertex in board.colors) {
      if (isAllowedStep(board, vertex, color)) {
        board.colors[vertex] = color;
        return board;
      }        
    }
  }
  return false;
};

const isEmptyVertex = (board, vertex) => {
  return (board.colors[vertex] === "white");
};

const hasEmptyVertex = (board) => {
  for (let vertex in board.colors) {
    if (isEmptyVertex(board, vertex)) return true;
  }
    return false;
};

const isGameEnd = (board) => {
  return !existsAllowedStep(board);
};


