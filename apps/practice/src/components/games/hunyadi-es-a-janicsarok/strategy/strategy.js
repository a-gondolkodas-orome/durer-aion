'use strict';

export const makeAiMove = (board, isPlayerTheFirstToMove) => {
  if (isPlayerTheFirstToMove) {
    const optimalGroupToKill = optimalKill(board);
    return getBoardAfterKillingGroup(board, optimalGroupToKill);
  } else {
    return { board: optimalColoring(board), isGameEnd: false };
  }
};

const optimalColoring = (board) => {
  let trueSum = 0.0;
  let falseSum = 0.0;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (trueSum < falseSum) {
        board[i][j] = true;
        trueSum += (1 / 2) ** i;
      } else {
        board[i][j] = false;
        falseSum += (1 / 2) ** i;
      }
    }
  }
  if (Math.random() > 0.5) {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < board[i].length; j++) {
        board[i][j] = !board[i][j];
      }
    }
  }
  return board;
}

const optimalKill = (board) => {
  if (board[0].length > 0) {
    return board[0][0];
  }
  let trueSum = 0.0;
  let falseSum = 0.0;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j]) {
        trueSum += (1 / 2) ** i;
      } else {
        falseSum += (1 / 2) ** i;
      }
    }
  }
  return trueSum > falseSum;
}

export const generateNewBoard = () => {
  let sum = 2.0 + Math.ceil(Math.random() * 8) / 8 - 0.5;
  let board = [];
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (sum; sum >= ((1.0 / 2.0) ** i); sum -= ((1.0 / 2.0) ** i)) {
      row.push(true);
    }
    board.push(row);
  }
  for (let i = 0; i < 4; i++) {
    for (let j = board[i].length - 1; j >= 0; j--) {
      if (Math.random() > 0.5) {
        board[i].splice(j, 1);
        board[i + 1].push(true); board[i + 1].push(true);
      }
    }
  }

  return board;
};

export const getBoardAfterKillingGroup = (board, groupValue) => {
  let isGameEnd = false;
  let sum = 0;
  let hasFirstPlayerWon = undefined;
  for (const j in board[0]) {
    if (board[0][j] !== groupValue) { // a soldier reached the castle
      isGameEnd = true;
      hasFirstPlayerWon = true;
    }
  }
  for (const i in board) {
    if (i != 0) {
      for (const j in board[i]) {
        if (board[i][j] !== groupValue) {
          sum++;
          board[i - 1].push(board[i][j]); // a soldier still lives and can step up the stairs
        }
      }
    }

    board[i] = [];
  }
  if (sum === 0 && !isGameEnd) {
    isGameEnd = true;
    hasFirstPlayerWon = false;
  }
  return { board, isGameEnd, hasFirstPlayerWon };
}
