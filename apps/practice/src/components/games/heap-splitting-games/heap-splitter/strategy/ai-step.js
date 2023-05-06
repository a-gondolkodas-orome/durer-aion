'use strict';

import { random } from 'lodash-es';
import { generateRandomEvenBetween } from '../../../../../lib/generate-random';

export const getAiStep = (board) => {
  const randomPileIndex = random(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[1 - randomPileIndex] === 1)
    ? randomPileIndex
    : 1 - randomPileIndex;

  const pieceIndex = getOptimalDivision(board[pileIndexToSplit]);
  return { rowIndex: pileIndexToSplit, pieceIndex };
};

const getOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return 1;

  return 1 + generateRandomEvenBetween(0, pieceCountInPile - 2);
};
