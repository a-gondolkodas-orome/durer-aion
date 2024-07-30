'use strict';

import { random } from 'lodash';

export const getBoardAfterAiTurn = (board) => {
  const { pileId, pieceId } = getAiStep(board);
  return {
    intermediateBoard: pileId === 0 ? [board[0], 0] : [0, board[1]],
    nextBoard: [pieceId + 1, board[pileId] - pieceId - 1]
  };
};

const getAiStep = (board) => {
  const randomPileIndex = random(0, 1);

  const PileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[1 - randomPileIndex] === 1)
    ? randomPileIndex
    : 1 - randomPileIndex;

  const pieceId = getOptimalDivision(board[PileIndexToSplit]);
  return { pileId: PileIndexToSplit, pieceId };
};

const getOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return 0;

  return generateRandomEvenBetween(0, pieceCountInPile - 2);
};

const generateRandomEvenBetween = (low, high) => {
  return 2 * random(Math.ceil(low / 2), Math.floor(high / 2));
};
