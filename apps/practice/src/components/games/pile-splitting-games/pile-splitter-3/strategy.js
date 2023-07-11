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
    return getBoardAfterAiTurn(board.map((x) => x / 2)).map((x) => x * 2);
  }
};

const getOptimalDivision = function (board, first, second) {
  const sum = board[first];

  const move = [...board];

  if (sum === 2) {
    move[first] = 1;
    move[second] = 1;
    return move;
  }

  const firstPile = 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));
  move[first] = firstPile;
  move[second] = sum - firstPile;

  return move;
};
