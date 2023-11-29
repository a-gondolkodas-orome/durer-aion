'use strict';

import { random, range, sample } from 'lodash';

export const getBoardAfterAiTurn = (board) => {
  const start = random(0, 3);

  const odds = board.filter(p => p % 2 === 1).length;

  if (odds === 4) {
    const notSinglePileIndices = range(0, 4).filter(i => board[i] !== 1);
    const first = sample(notSinglePileIndices);
    return getOptimalDivision(board, first, (first + 1) % 4);
  }

  if (odds === 3) {
    const evenPileIndex = range(0, 4).find(i => board[i] % 2 === 0);
    return getOptimalDivision(board, evenPileIndex, (evenPileIndex + 1) % 4);
  }

  if (odds === 2) {
    const evenPileIndices = range(0, 4).filter(i => board[i] % 2 === 0);
    return getOptimalDivision(board, evenPileIndices[0], evenPileIndices[1]);
  }

  if (odds === 1) {
    const oddPile = range(0, 4).find(i => board[i] % 2 === 1);
    if (
      board[oddPile] === 1 && board[(oddPile + 1) % 4] === 2 &&
      board[(oddPile + 2) % 4] === 2 && board[(oddPile + 3) % 4] === 2
    ) {
      return getOptimalDivision(board, (oddPile + 1) % 4, (oddPile + 2) % 4);
    } else {
      let modifiedBoard = [...board];
      modifiedBoard[oddPile] += 1;
      const { newBoard, intermediateBoard } = getBoardAfterAiTurn(modifiedBoard);
      newBoard[oddPile] -= 1;
      intermediateBoard[oddPile] -= 1;
      return { newBoard, intermediateBoard };
    }
  }

  if (odds === 0) {
    if (board[0] === 2 && board[1] === 2 && board[2] === 2 && board[3] === 2) {
      return getOptimalDivision(board, start, (start + 1) % 4);
    } else {
      const { newBoard, intermediateBoard } = getBoardAfterAiTurn(board.map((x) => x / 2));
      return { newBoard: newBoard.map((x) => x * 2), intermediateBoard: intermediateBoard.map(x => x * 2) };
    }
  }
};

export const isWinningState = board => {
  const oddPileIndices = range(0, 4).filter(i => board[i] % 2 === 1);
  const oddPileCount = oddPileIndices.length;

  if (oddPileCount === 4) return true;
  if (oddPileCount === 3 || oddPileCount === 2) return false;

  if (oddPileCount === 1) {
    const modifiedBoard = [...board];
    modifiedBoard[oddPileIndices[0]] += 1;
    return isWinningState(modifiedBoard);
  }
  if (oddPileCount === 0) {
    return isWinningState(board.map(x => x / 2));
  }
}

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
