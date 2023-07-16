'use strict';

import { random } from 'lodash';

export const getBoardAfterAiTurn = function (board) {
  const start = random(0, 2);

  if (board[0] % 2 === 1 || board[1] % 2 === 1 || board[2] % 2 === 1) {
    if (board[start] % 2 === 0) {
      if (board[(start + 1) % 3] % 2 === 0) return getOptimalDivision(board, start, (start + 1) % 3);
      else return getOptimalDivision(board, start, (start + 2) % 3);
    } else if (board[(start + 1) % 3] % 2 === 0) {
      return getOptimalDivision(board, (start + 1) % 3, (start + 2) % 3);
    } else if (board[(start + 2) % 3] % 2 === 0) {
      return getOptimalDivision(board, (start + 2) % 3, (start + 1) % 3);
    } else {
      if (board[start] !== 1) return getOptimalDivision(board, start, (start + 1) % 3);
      else if (board[(start + 1) % 3] !== 1) return getOptimalDivision(board, (start + 1) % 3, (start + 2) % 3);
      else return getOptimalDivision(board, (start + 2) % 3, start);
    }
  } else if (board[0] === 2 && board[1] === 2 && board[2] === 2) {
    return getOptimalDivision(board, start, (start + 1) % 3);
  } else {
    //this is the case where all piles have even number of pieces
    //should not occur in an optimal game with 37 pieces
    //with this the enemy also has a strategy when the game starts with 36 pieces
    const { newBoard, intermediateBoard } = getBoardAfterAiTurn(board.map((x) => x / 2));
    return { newBoard: newBoard.map((x) => x * 2), intermediateBoard: intermediateBoard.map(x => x * 2) };
  }
};

const getOptimalDivision = function (board, first, second) {
  const sum = board[first];

  const intermediateBoard = [...board];
  intermediateBoard[second] = 0;

  const newBoard = [...board];

  if (sum === 2) {
    newBoard[first] = 1;
    newBoard[second] = 1;
    return { newBoard, intermediateBoard };
  }

  const firstPile = 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));
  newBoard[first] = firstPile;
  newBoard[second] = sum - firstPile;

  return { intermediateBoard, newBoard };
};
