'use strict';

import { random, flatten, cloneDeep, sum } from 'lodash';

export const getGameStateAfterAiTurn = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === 0) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    return getGameStateAfterKillingGroup(board, optimalGroupToKill);
  } else {
    return { nextBoard: colorBoardOptimally(board), isGameEnd: false };
  }
};

export const generateStartBoard = () => {
  // this code is not 50% Hunyadi - 50% Szultan winnin position generator,
  // but relatively balanced and biased toward situations with more soldiers
  // and not single-step game
  const rowCount = 5;
  let board = [];
  // for debugging purposes
  let totalScore = 0;
  for (let i = 0; i < (rowCount - 1); i++) {
    const row = [];
    if (i === 0) {
      row.push('blue');
      totalScore += 1;
    }
    if (random(0, 6) >= 3) {
      row.push('blue');
      totalScore += (1/2)**i;
    }
    board.push(row);
  }
  board.push([]);

  for (let i = 0; i < (rowCount - 1); i++) {
    for (let j of board[i]) {
      if (random(0, 4) >= 2) {
        board[i].splice(j, 1);
        board[i + 1].push('blue', 'blue');
      }
    }
  }

  const soldierCount = sum(board.map(row => row.length));
  if (totalScore <= 1.25 || soldierCount <= 2) {
    // generate a more complex situation
    return generateStartBoard();
  }

  // first pile: for soldiers who reached the castle
  return [[], ...board];
};

export const getGameStateAfterKillingGroup = (board, group) => {
  let isGameEnd = false;
  let hasFirstPlayerWon = undefined;
  const intermediateBoard = cloneDeep(board);
  const nextBoard = cloneDeep(board);

  for (let i = 1; i < nextBoard.length; i++) {
    const remainingSoldiersInRow = nextBoard[i].filter((soldier) => soldier !== group);
    if (remainingSoldiersInRow.length > 0) {
      if (i === 1) {
        isGameEnd = true;
        hasFirstPlayerWon = true;
      }
      nextBoard[i - 1].push(...remainingSoldiersInRow);
    }
    intermediateBoard[i] = remainingSoldiersInRow;
    nextBoard[i] = [];
  }

  if (flatten(nextBoard).length === 0 && !isGameEnd) {
    isGameEnd = true;
    hasFirstPlayerWon = false;
  }
  if (isGameEnd) {
    return { nextBoard, intermediateBoard, isGameEnd, winnerIndex: hasFirstPlayerWon ? 0 : 1 };
  } else {
    return { nextBoard, intermediateBoard, isGameEnd };
  }
};

const colorBoardOptimally = (board) => {
  const groupScores = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';
  const nextBoard = cloneDeep(board);

  for (let i = 1; i < nextBoard.length; i++) {
    for (let j = 0; j < nextBoard[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      nextBoard[i][j] = nextGroup;
      groupScores[nextGroup] += (1 / 2) ** (i - 1);
    }
  }

  return nextBoard;
};

const getOptimalGroupToKill = (board) => {
  if (board[1].length > 0) {
    return board[1][0];
  }

  const groupScores = { blue: 0, red: 0 };
  for (let i = 1; i < board.length; i++) {
    for (const soldier of board[i]) {
      groupScores[soldier] += (1 / 2) ** (i - 1);
    }
  }

  return groupScores['blue'] > groupScores['red'] ? 'blue' : 'red';
};
