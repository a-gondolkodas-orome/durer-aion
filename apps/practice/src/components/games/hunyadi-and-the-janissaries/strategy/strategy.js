'use strict';

import { random, flatten } from 'lodash-es';

export const makeAiMove = (board, isPlayerTheFirstToMove) => {
  if (isPlayerTheFirstToMove) {
    const optimalGroupToKill = optimalKill(board);
    return getBoardAfterKillingGroup(board, optimalGroupToKill);
  } else {
    return { board: optimalColoring(board), isGameEnd: false };
  }
};

export const isTheLastMoverTheWinner = null;

const optimalColoring = (board) => {
  const groupScores = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      board[i][j] = nextGroup;
      groupScores[nextGroup] += (1 / 2) ** i;
    }
  }

  return board;
};

const optimalKill = (board) => {
  if (board[0].length > 0) {
    return board[0][0];
  }

  const groupScores = { blue: 0, red: 0 };
  for (let i = 0; i < board.length; i++) {
    for (const soldier of board[i]) {
      groupScores[soldier] += (1 / 2) ** i;
    }
  }

  return groupScores['blue'] > groupScores['red'] ? 'blue' : 'red';
};

export const generateNewBoard = () => {
  const rowCount = 5;
  let board = [];
  for (let i = 0; i < (rowCount - 1); i++) {
    const row = [];
    if (i === 0) row.push('blue');
    if (random(0, 1) === 1) row.push('blue');
    board.push(row);
  }
  board.push([]);

  for (let i = 0; i < (rowCount - 1); i++) {
    for (let j of board[i]) {
      if (random(0, 1) === 1) {
        board[i].splice(j, 1);
        board[i + 1].push('blue', 'blue');
      }
    }
  }

  return board;
};

export const getBoardAfterKillingGroup = (board, group) => {
  let isGameEnd = false;
  let hasFirstPlayerWon = undefined;

  for (let i = 0; i < board.length; i++) {
    const remainingSoldiersInRow = board[i].filter((soldier) => soldier !== group);
    if (remainingSoldiersInRow.length > 0) {
      if (i === 0) {
        isGameEnd = true;
        hasFirstPlayerWon = true;
      } else {
        board[i - 1].push(...remainingSoldiersInRow);
      }
    }
    board[i] = [];
  }

  if (flatten(board).length === 0 && !isGameEnd) {
    isGameEnd = true;
    hasFirstPlayerWon = false;
  }
  return { board, isGameEnd, hasFirstPlayerWon };
};
