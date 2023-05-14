'use strict';

import { random, isEqual } from 'lodash-es';

export const generateNewBoard = () => {
  const x = random(4, 20);
  const y = random(Math.max(4, 17 - x), Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const getGameStateAfterMove = (board, { removedPileId, splitPileId, pieceId }) => {
  if (removedPileId < splitPileId) {
    board[removedPileId] = pieceId + 1;
    board[splitPileId] = board[splitPileId] - pieceId - 1;
  } else {
    board[removedPileId] = board[splitPileId] - pieceId - 1;
    board[splitPileId] = pieceId + 1;
  }
  return { board, isGameEnd: isGameEnd(board) };
};

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => isEqual(board, [1, 1, 1]);

const getBoardAfterAiStep = function (board) {
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
    return getBoardAfterAiStep(board.map((x) => x / 2)).map((x) => x * 2);
  }
};

const getOptimalDivision = function (board, first, second) {
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
