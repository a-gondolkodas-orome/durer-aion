'use strict';

import { random, isEqual } from 'lodash-es';
import { generateRandomEvenBetween } from '../../../../../lib/generate-random';

export const generateNewBoard = () => ([random(3, 10), random(3, 10)]);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  return getGameStateAfterMove(board, getAiStep(board));
};

export const getGameStateAfterMove = (board, { pileId, pieceId }) => {
  const newBoard = [pieceId + 1, board[pileId] - pieceId - 1];
  return { board: newBoard, isGameEnd: isEqual(newBoard, [1, 1]) };
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
