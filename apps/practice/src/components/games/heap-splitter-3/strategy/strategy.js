'use strict';

import { random, difference } from 'lodash-es';

export const generateNewBoard = () => {
  const x = random(4, 20);
  const y = random(Math.max(4, 17 - x), Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const getBoardAfterPlayerStep = (board, { removedRowIndex, splitRowIndex, pieceIndex }) => {
  const keptRowIndex = difference([0, 1, 2], [removedRowIndex, splitRowIndex]);
  const newBoard = [board[keptRowIndex[0]], pieceIndex, board[splitRowIndex] - pieceIndex];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => board[0] === 1 && board[1] === 1 && board[2] === 1;

export const makeAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const getBoardAfterAiStep = function (board) {
  const start = random(0, 2);

  if (board[0] % 2 === 1 || board[1] % 2 === 1 || board[2] % 2 === 1) {
    if (board[start] % 2 === 0) {
      if (board[(start + 1) % 3] % 2 === 0) return findOptimalDivision(board, start, (start + 1) % 3);
      else return findOptimalDivision(board, start, (start + 2) % 3);
    } else if (board[(start + 1) % 3] % 2 === 0) {
      return findOptimalDivision(board, (start + 1) % 3, (start + 2) % 3);
    } else if (board[(start + 2) % 3] % 2 === 0) {
      return findOptimalDivision(board, (start + 2) % 3, (start + 1) % 3);
    } else {
      if (board[start] !== 1) return findOptimalDivision(board, start, (start + 1) % 3);
      else if (board[(start + 1) % 3] !== 1) return findOptimalDivision(board, (start + 1) % 3, (start + 2) % 3);
      else return findOptimalDivision(board, (start + 2) % 3, start);
    }
  } else if (board[0] === 2 && board[1] === 2 && board[2] === 2) {
    return findOptimalDivision(board, start, (start + 1) % 3);
  } else {
    //this is the case where all piles have even number of pieces
    //should not occur in an optimal game with 37 pieces
    //with this the enemy also has a strategy when the game starts with 36 pieces
    return getBoardAfterAiStep(board.map((x) => x / 2)).map((x) => x * 2);
  }
};

const findOptimalDivision = function (board, first, second) {
  const sum = board[first];

  let move = board;

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
