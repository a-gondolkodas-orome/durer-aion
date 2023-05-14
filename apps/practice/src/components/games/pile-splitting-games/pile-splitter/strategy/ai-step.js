'use strict';

import { random } from 'lodash-es';
import { generateRandomEvenBetween } from '../../../../../lib/generate-random';

export const getAiStep = (board) => {
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
