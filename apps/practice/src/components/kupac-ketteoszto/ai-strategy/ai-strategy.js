'use strict';

import { generateRandomIntBetween } from "../../../lib/generate-random";

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
  const startPile = 1 + generateEven(pieceCountInPile - 2);
  move[pileIndexToSplit] = startPile;
  move[other(pileIndexToSplit)] = pieceCountInPile - startPile;

  return move;
};

const other = current => 1 - current;

const generateEven = num => 2 * Math.ceil(Math.random() * Math.floor(num / 2));