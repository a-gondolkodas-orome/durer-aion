'use strict';

import { random, isEqual, range, sample } from 'lodash-es';

export const generateNewBoard = () => ([random(4, 18), random(4, 18), random(4, 18), random(4, 18)]);

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

const isGameEnd = (board) => isEqual(board, [1, 1, 1, 1]);

export const getGameStateAfterAiMove = (board) => {
  const newBoard = getBoardAfterAiStep(board);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const getBoardAfterAiStep = (board) => {
  const start = random(0, 3);

  const odds = board.filter(p => p % 2 === 1).length;

  if (odds === 4) {
    const notSinglePileIndices = range(0, 3).filter(i => board[i] !== 1);
    const first = sample(notSinglePileIndices);
    return getOptimalDivision(board, first, (first + 1) % 4);
  }

  if (odds === 3) {
    const evenPileIndex = range(0, 3).find(i => board[i] % 2 === 0);
    return getOptimalDivision(board, evenPileIndex, (evenPileIndex + 1) % 4);
  }

  if (odds === 2) {
    const evenPileIndices = range(0, 3).filter(i => board[i] % 2 === 0);
    return getOptimalDivision(board, evenPileIndices[0], evenPileIndices[1]);
  }

  if (odds === 1) {
    const oddPile = range(0, 3).find(i => board[i] % 2 === 1);
    if (
      board[oddPile] === 1 && board[(oddPile + 1) % 4] === 2 &&
      board[(oddPile + 2) % 4] === 2 && board[(oddPile + 3) % 4] === 2
    ) {
      return getOptimalDivision(board, (oddPile + 1) % 4, (oddPile + 2) % 4);
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
      return getOptimalDivision(board, start, (start + 1) % 4);
    } else {
      return getBoardAfterAiStep(board.map((x) => x / 2)).map((x) => x * 2);
    }
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
