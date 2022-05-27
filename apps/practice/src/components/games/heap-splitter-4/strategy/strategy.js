'use strict';

import { random, difference } from 'lodash-es';

export const generateNewBoard = () => ([random(4, 18), random(4, 18), random(4, 18), random(4, 18)]);

export const getBoardAfterPlayerStep = (board, { removedRowIndex, splitRowIndex, pieceIndex }) => {
  const keptRowIndices = difference([0, 1, 2, 3], [removedRowIndex, splitRowIndex]);
  const newBoard = [board[keptRowIndices[0]], board[keptRowIndices[1]], pieceIndex, board[splitRowIndex] - pieceIndex];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = (board) => board[0] === 1 && board[1] === 1 && board[2] === 1 && board[3] === 1;

export const makeAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const getBoardAfterAiStep = (board) => {
  const start = random(0, 3);

  let odds = 0;

  if (board[0] % 2 === 1) odds += 1;
  if (board[1] % 2 === 1) odds += 1;
  if (board[2] % 2 === 1) odds += 1;
  if (board[3] % 2 === 1) odds += 1;

  if (odds === 4) {
    let first = start;
    while (board[first] === 1) {
      first += 1;
      first %= 4;
    }
    return findOptimalDivision(board, first, (first + 1) % 4);
  }

  if (odds === 3) {
    let first = start;
    while (board[first] % 2 === 1) {
      first += 1;
      first %= 4;
    }
    return findOptimalDivision(board, first, (first + 1) % 4);
  }

  if (odds === 2) {
    let first = start;
    while (board[first] % 2 === 1) {
      first += 1;
      first %= 4;
    }
    let second = (first + 1) % 4;
    while (board[second] % 2 === 1) {
      second += 1;
      second %= 4;
    }
    return findOptimalDivision(board, first, second);
  }

  if (odds === 1) {
    let oddPile = 0;
    while (board[oddPile] % 2 === 0) {
      oddPile += 1;
      oddPile %= 4;
    }
    if (
      board[oddPile] === 1 && board[(oddPile + 1) % 4] === 2 &&
      board[(oddPile + 2) % 4] === 2 && board[(oddPile + 3) % 4] === 2
    ) {
      return findOptimalDivision(board, (oddPile + 1) % 4, (oddPile + 2) % 4);
    } else {
      let modifiedBoard = board;
      modifiedBoard[oddPile] += 1;
      modifiedBoard = getBoardAfterAiStep(modifiedBoard);
      modifiedBoard[oddPile] -= 1;
      return modifiedBoard;
    }
  }

  if (odds === 0) {
    if (board[0] === 2 && board[1] === 2 && board[2] === 2 && board[3] === 2) {
      return findOptimalDivision(board, start, (start + 1) % 4);
    } else {
      return getBoardAfterAiStep(board.map((x) => x / 2)).map((x) => x * 2);
    }
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
