'use strict';

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

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  isPlayerTheFirstToMove ? board = makeOptimalStepAsSecond(board) : board = makeOptimalStepAsFirtst(board);
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  let hasFirstPlayerWon = !hasEmptyVertex(board);
  return { board, isGameEnd: isGameEnd(board), hasFirstPlayerWon };
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

const makeOptimalStepAsFirtst = (board) => {
  let optimalOrderOfVertices = [2, 4, 0, 1, 3, 5, 6, 7];
  for (let vertex of optimalOrderOfVertices) {
    for (let color of board.usedColors) {
      if (isAllowedStep(board, vertex, color)) {
        board.colors[vertex] = color;
        return board;
      }
    }
  }
  return false;
};

const makeOptimalStepAsSecond = (board) => {
  let optimalOrderOfVertices = [0, 1, 3, 5, 6, 7, 2, 4];
  for (let vertex of optimalOrderOfVertices) {
    let missingColors = getMissingColors(board, vertex);
    if (isEmptyVertex(board, vertex) && missingColors.size === 1) {
      for (let v of getEmptyNeighbours(board, vertex)) {
        for (let c of missingColors) {
          if (isAllowedStep(board, v, c)) {
            board.colors[v] = c;
            return board;
          }
        }
      }
    }
  }

  for (let vertex of optimalOrderOfVertices) {
    let missingColors = getMissingColors(board, vertex);
    if (isEmptyVertex(board, vertex) && missingColors.size === 2) {
      for (let v of getEmptyNeighbours(board, vertex)) {
        for (let c of missingColors) {
          if (isAllowedStep(board, v, c)) {
            board.colors[v] = c;
            return board;
          }
        }
      }
    }
  }


  for (let vertex of optimalOrderOfVertices) {
    for (let color of board.usedColors) {
      if (isAllowedStep(board, vertex, color)) {
        board.colors[vertex] = color;
        return board;
      }
    }
  }
  return false;
};

const getMissingColors = (board, vertex) => {
  let nbColors = new Set();
  for (let v of board.neighbours[vertex]) {
    nbColors.add(board.colors[v]);
  }
  let missingColors = new Set();
  for (let c of board.usedColors) {
    if (!nbColors.has(c)) missingColors.add(c);
  }
  return missingColors;
};

const getEmptyNeighbours = (board, vertex) => {
  let emptyNeighbours = new Set();
  for (let v of board.neighbours[vertex]) {
    if (isEmptyVertex(board, v)) emptyNeighbours.add(v);
  }
  return emptyNeighbours;
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
