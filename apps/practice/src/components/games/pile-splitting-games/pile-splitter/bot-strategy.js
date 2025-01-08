'use strict';

import { random } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const { pileId, pieceCount } = getAiStep(board);
  // 1 - pileId is the other pile. we split one and remove the other pile
  const { nextBoard } = moves.removePile(board, 1 - pileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceCount });
  }, 750)
};

const getAiStep = (board) => {
  const randomPileIndex = random(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[1 - randomPileIndex] === 1)
    ? randomPileIndex
    : 1 - randomPileIndex;

  const pieceCount = getOptimalDivision(board[pileIndexToSplit]);
  return { pileId: pileIndexToSplit, pieceCount };
};

const getOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return 1;

  return generateRandomOddBetween(1, pieceCountInPile - 1);
};

const generateRandomOddBetween = (low, high) => {
  return 1 + 2 * random(Math.ceil((low - 1) / 2), Math.floor((high - 1) / 2));
};
