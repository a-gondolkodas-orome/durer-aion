'use strict';

export const makeMove = function(board) {
  const start = Math.floor(Math.random() * 2);

  if (board[start] === 1) return findOptimalDivision(board[(start + 1) % 2], (start + 1) % 2);
  else if (board[(start + 1) % 2] === 1) return findOptimalDivision(board[start], start);
  else if (board[start] % 2 === 0) return findOptimalDivision(board[start], start);
  else return findOptimalDivision(board[(start + 1) % 2], (start + 1) % 2);

};

const findOptimalDivision = function(sum, start) {
  let move = [];

  if (sum === 2) {
    move[start] = 1;
    move[(start + 1) % 2] = 1;
    return move;
  }

  const startPile = 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));
  move[start] = startPile;
  move[(start + 1) % 2] = sum - startPile;

  return move;
};
