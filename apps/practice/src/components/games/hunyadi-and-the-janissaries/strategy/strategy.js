'use strict';

import { random, flatten, cloneDeep, sum } from 'lodash';

export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  if (playerIndex === 0) {
    const optimalGroupToKill = getOptimalGroupToKill(board);
    return getGameStateAfterKillingGroup(board, optimalGroupToKill);
  } else {
    return { newBoard: colorBoardOptimally(board), isGameEnd: false };
  }
};

export const generateNewBoard = () => {
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
    return generateNewBoard();
  }

  return board;
};

export const getGameStateAfterKillingGroup = (board, group) => {
  let isGameEnd = false;
  let hasFirstPlayerWon = undefined;
  const intermediateBoard = cloneDeep(board);
  const newBoard = cloneDeep(board);

  for (let i = 0; i < newBoard.length; i++) {
    const remainingSoldiersInRow = newBoard[i].filter((soldier) => soldier !== group);
    if (remainingSoldiersInRow.length > 0) {
      if (i === 0) {
        isGameEnd = true;
        hasFirstPlayerWon = true;
      } else {
        newBoard[i - 1].push(...remainingSoldiersInRow);
      }
    }
    intermediateBoard[i] = remainingSoldiersInRow;
    newBoard[i] = [];
  }

  if (flatten(newBoard).length === 0 && !isGameEnd) {
    isGameEnd = true;
    hasFirstPlayerWon = false;
  }
  if (isGameEnd) {
    return { newBoard, intermediateBoard, isGameEnd, winnerIndex: hasFirstPlayerWon ? 0 : 1 };
  } else {
    return { newBoard, intermediateBoard, isGameEnd };
  }
};

const colorBoardOptimally = (board) => {
  const groupScores = { blue: 0, red: 0 };
  const firstColor = random(0, 1) === 1 ? 'red' : 'blue';
  const secondColor = firstColor === 'blue' ? 'red' : 'blue';
  const newBoard = cloneDeep(board);

  for (let i = 0; i < newBoard.length; i++) {
    for (let j = 0; j < newBoard[i].length; j++) {
      const nextGroup = groupScores[firstColor] < groupScores[secondColor] ? firstColor : secondColor;
      newBoard[i][j] = nextGroup;
      groupScores[nextGroup] += (1 / 2) ** i;
    }
  }

  return newBoard;
};

const getOptimalGroupToKill = (board) => {
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
