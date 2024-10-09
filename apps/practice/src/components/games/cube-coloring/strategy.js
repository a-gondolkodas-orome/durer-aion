'use strict';

import { isNull, every, some, difference, range, shuffle, sample } from 'lodash';

const allColors = ['#dc2626', '#eab308', '#2563eb'];

export const getGameStateAfterAiTurn = ({ board, ctx }) => {
  let nextBoard = [...board];
  // TODO: instead of using let, make below functions not changing their argument
  nextBoard = ctx.playerIndex === 0 ? makeOptimalStepAsSecond(nextBoard) : makeOptimalStepAsFirst(nextBoard);
  return getGameStateAfterMove(nextBoard);
};

export const getGameStateAfterMove = (nextBoard) => {
  return {
    nextBoard,
    isGameEnd: isGameEnd(nextBoard),
    winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1
  };
};

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
  const mainDiagonal = shuffle([2, 4]);
  const otherVertices = shuffle([0, 1, 3, 5, 6, 7]);
  const vertexToColor = [...mainDiagonal, ...otherVertices].find(v => isNull(board[v]));
  const colors = allColors.filter(c => isAllowedStep(board, vertexToColor, c));
  board[vertexToColor] = sample(colors);
  return board;
};

const makeOptimalStepAsSecond = (board) => {
  const emptyVertices = shuffle(range(0, 8)).filter(v => isNull(board[v]));

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

  // if player does not start on main diagonal, color opposing node with same color
  const pairs = shuffle([[0, 6], [6, 0], [1, 7], [7, 1], [3, 5], [5, 3]]);
  for (const p of pairs) {
    if (!isNull(board[p[0]]) && isAllowedStep(board, p[1], board[p[0]])) {
      board[p[1]] = board[p[0]];
      return board;
    }
  }

  // make a non-neighboring step if possible
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
    for (const color of shuffle(allColors)) {
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
