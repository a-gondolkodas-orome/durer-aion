'use strict';

export const makeMove = (board, killState) => {
  if (killState) {
    return optimalKill(board);
  } else {
    return optimalColoring(board);
  }
};

const optimalColoring = function(board) {
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

const optimalKill = function(board) {
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
