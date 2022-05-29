'use strict';

import { random, flatten } from 'lodash-es';
import { getOptimalGroupToKill, colorBoardOptimally } from './ai-step';

export const getGameStateAfterAiMove = (board, isPlayerTheFirstToMove) => {
  if (isPlayerTheFirstToMove) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    return getGameStateAfterKillingGroup(board, optimalGroupToKill);
  } else {
    return { board: colorBoardOptimally(board), isGameEnd: false };
  }
};

export const isTheLastMoverTheWinner = null;

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

export const getGameStateAfterKillingGroup = (board, group) => {
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
