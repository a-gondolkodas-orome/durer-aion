'use strict';

import { generateRandomIntBetween, generateRandomEvenBetween } from '@/lib/generate-random';

export const makeAiMove = board => {
  const randomPileIndex = generateRandomIntBetween(0, 1);

  const pileIndexToSplit = (board[randomPileIndex] % 2 === 0 || board[other(randomPileIndex)] === 1)
    ? randomPileIndex
    : other(randomPileIndex);

  const newBoard = findOptimalDivision(board[pileIndexToSplit]);
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const findOptimalDivision = (pieceCountInPile) => {
  if (pieceCountInPile === 2) return [1, 1];

  const countInFirstPartAfterSplit = generateRandomEvenBetween(1, pieceCountInPile - 1);
  return [countInFirstPartAfterSplit, pieceCountInPile - countInFirstPartAfterSplit];
};

const other = current => 1 - current;

export const getBoardAfterPlayerStep = (board, { rowIndex, pieceIndex }) => {
  const newBoard = [pieceIndex - 1, board[rowIndex] - pieceIndex + 1];
  return { board: newBoard, isGameEnd: isGameEnd(newBoard) };
};

const isGameEnd = board => board[0] === 1 && board[1] === 1;

export const generateNewBoard = () => ([generateRandomIntBetween(3, 10), generateRandomIntBetween(3, 10)]);
