'use strict';

import { isNull, every, some, difference, range } from 'lodash-es';

export const generateNewBoard = () => Array(8).fill(null);

export const allColors = ["red", "green", "blue"];

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  board = isPlayerTheFirstToMove ? makeOptimalStepAsSecond(board) : makeOptimalStepAsFirst(board);
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return {
    board,
    isGameEnd: isGameEnd(board),
    hasFirstPlayerWon: hasFirstPlayerWon(board)
  };
};

export const isTheLastMoverTheWinner = null;

export const isAllowedStep = (board, vertex, color) => {
  if (!isNull(board[vertex])) return false;
  return every(neighbours[vertex], i => isNull(board[i]) || board[i] !== color);
};

const neighbours = {
  0: [1, 3, 4],
  1: [0, 2, 5],
  2: [1, 3, 4, 6],
  3: [0, 2, 7],
  4: [0, 2, 5, 7],
  5: [1, 4, 6],
  6: [2, 5, 7],
  7: [3, 4, 6]
};

const isGameEnd = board => {
  const canUseColor = color => some(range(0, 8), v => isAllowedStep(board, v, color));
  return every(allColors, color => !canUseColor(color));
};

const hasFirstPlayerWon = board => every(board, v => !isNull(v));

const makeOptimalStepAsFirst = (board) => {
  const optimalOrderOfVertices = [2, 4, 0, 1, 3, 5, 6, 7];
  const vertexToColor = optimalOrderOfVertices.find(v => isNull(board[v]));
  const color = allColors.find(c => isAllowedStep(board, vertexToColor, c));
  board[vertexToColor] = color;
  return board;
};

const makeOptimalStepAsSecond = (board) => {
  const optimalOrderOfVertices = [0, 1, 3, 5, 6, 7, 2, 4];
  const emptyVertices = optimalOrderOfVertices.filter(v => isNull(board[v]));

  // try to immediately make a vertex uncolorable
  for (const vertex of emptyVertices) {
    const missingColors = getMissingColors(board, vertex);
    if (missingColors.length === 1) {
      for (const v of getEmptyNeighbours(board, vertex)) {
        if (isAllowedStep(board, v, missingColors[0])) {
          board[v] = missingColors[0];
          return board;
        }
      }
    }
  }
  for (const vertex of emptyVertices) {
    const missingColors = getMissingColors(board, vertex);
    if (missingColors.length === 2) {
      for (const v of getEmptyNeighbours(board, vertex)) {
        if (isAllowedStep(board, v, missingColors[0])) {
          board[v] = missingColors[0];
          return board;
        }
      }
    }
  }
  // every vertex is either banned or has no colored neighbor
  for (const vertex of emptyVertices) {
    for (const color of allColors) {
      if (isAllowedStep(board, vertex, color)) {
        board[vertex] = color;
        return board;
      }
    }
  }
  // if all vertices are banned we should have a game end
  console.error("This state should not happen");
};

const getMissingColors = (board, vertex) => {
  const nbColors = neighbours[vertex].map(v => board[v]);
  return difference(allColors, nbColors);
};

const getEmptyNeighbours = (board, vertex) => {
  return neighbours[vertex].filter(i => isNull(board[i]));
};
