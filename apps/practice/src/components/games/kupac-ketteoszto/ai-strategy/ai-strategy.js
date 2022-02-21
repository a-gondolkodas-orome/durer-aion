'use strict';

import { generateRandomIntBetween, generateRandomEvenBetween } from '@/lib/generate-random';

export const makeAiMove = board => {
  const randomPileIndex = generateRandomIntBetween(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[other(randomPileIndex)] === 1)
    ? randomPileIndex
    : other(randomPileIndex);

  return findOptimalDivision(board[pileIndexToSplit]);
};

const findOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return [1, 1];
  
  const countInFirstPartAfterSplit = generateRandomEvenBetween(1, pieceCountInPile - 1);
  return [countInFirstPartAfterSplit, pieceCountInPile - countInFirstPartAfterSplit];
};

const other = current => 1 - current;
