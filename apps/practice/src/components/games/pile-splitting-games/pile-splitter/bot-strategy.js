'use strict';

import { random } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const { pileId, pieceId } = getAiStep(board);
  // 1 - pileId is the other pile. we split one and remove the other pile
  const { nextBoard } = moves.removePile(board, 1 - pileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceId });
  }, 750)
};

const getAiStep = (board) => {
  const randomPileIndex = random(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[1 - randomPileIndex] === 1)
    ? randomPileIndex
    : 1 - randomPileIndex;

  const pieceId = getOptimalDivision(board[pileIndexToSplit]);
  return { pileId: pileIndexToSplit, pieceId };
};

const getOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return 0;

  return generateRandomEvenBetween(0, pieceCountInPile - 2);
};

const generateRandomEvenBetween = (low, high) => {
  return 2 * random(Math.ceil(low / 2), Math.floor(high / 2));
};
