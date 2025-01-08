'use strict';

import { range, random } from 'lodash';

export const generateStartBoard = () => {
  if (random(0, 1)) return generateWinningStartBoard();
  return generateLosingStartBoard();
};

const generateWinningStartBoard = (remainingTrials = 50) => {
  const board = [random(5, 12), random(5, 12), random(5, 12), random(5, 12)];
  if (!isWinningState(board)) {
    if (remainingTrials > 0) {
      return generateWinningStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
};

const generateLosingStartBoard = (remainingTrials = 50) => {
  const board = [random(5, 12), random(5, 12), random(5, 12), random(5, 12)];
  if (isWinningState(board)) {
    if (remainingTrials > 0) {
      return generateLosingStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
}

const isWinningState = board => {
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
