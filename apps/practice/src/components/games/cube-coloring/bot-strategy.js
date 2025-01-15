'use strict';

import { isNull, difference, range, shuffle, sample } from 'lodash';
import { allColors, isAllowedStep, neighbours } from './helpers';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const { vertex, color } = ctx.chosenRoleIndex === 0
    ? makeOptimalStepAsSecond(board)
    : makeOptimalStepAsFirst(board);
  moves.colorVertex(board, { vertex, color });
};

const makeOptimalStepAsFirst = (board) => {
  const mainDiagonal = shuffle([2, 4]);
  const otherVertices = shuffle([0, 1, 3, 5, 6, 7]);
  const vertexToColor = [...mainDiagonal, ...otherVertices].find(v => isNull(board[v]));
  const colors = allColors.filter(c => isAllowedStep(board, vertexToColor, c));
  return { vertex: vertexToColor, color: sample(colors) };
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
          return { vertex: v, color: missingColors[0] };
        }
      }
    }
  }

  // if player does not start on main diagonal, color opposing node with same color
  const pairs = shuffle([[0, 6], [6, 0], [1, 7], [7, 1], [3, 5], [5, 3]]);
  for (const p of pairs) {
    if (!isNull(board[p[0]]) && isAllowedStep(board, p[1], board[p[0]])) {
      board[p[1]] = board[p[0]];
      return { vertex: p[1], color: board[p[0]] };
    }
  }

  // make a non-neighboring step if possible
  for (const vertex of emptyVertices) {
    const missingColors = getMissingColors(board, vertex);
    if (missingColors.length === 2) {
      for (const v of getEmptyNeighbours(board, vertex)) {
        if (isAllowedStep(board, v, missingColors[0])) {
          board[v] = missingColors[0];
          return { vertex: v, color: missingColors[0] };
        }
      }
    }
  }
  // every vertex is either banned or has no colored neighbor
  for (const vertex of emptyVertices) {
    for (const color of shuffle(allColors)) {
      if (isAllowedStep(board, vertex, color)) {
        board[vertex] = color;
        return { vertex, color };
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
