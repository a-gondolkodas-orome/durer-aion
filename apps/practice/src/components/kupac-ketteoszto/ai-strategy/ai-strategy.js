'use strict';

import { generateRandomIntBetween, generateRandomEvenBetween } from "../../../lib/generate-random";

export const makeAiMove = function(board) {
  const randomPileIndex = generateRandomIntBetween(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[other(randomPileIndex)] === 1)
    ? randomPileIndex
    : other(randomPileIndex);

  return findOptimalDivision(board[pileIndexToSplit], pileIndexToSplit);
};

const findOptimalDivision = function(pieceCountInPile, pileIndexToSplit) {
  if (pieceCountInPile === 2) {
    return [1, 1];
  }
  
  let move = [];
  move[pileIndexToSplit] = generateRandomEvenBetween(1, pieceCountInPile - 1);
  move[other(pileIndexToSplit)] = pieceCountInPile - move[pileIndexToSplit];

  return move;
};

const other = current => 1 - current;
