'use strict';

import { random, sample } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const botStep = getAiStep(board);
  executeBotStrategy(botStep, { board, moves });
}

export const randomBotStrategy = ({ board, moves }) => {
  const botStep = getRandomStep(board);
  executeBotStrategy(botStep, { board, moves });
}

const executeBotStrategy = ({ pileId, pieceCount }, { board, moves }) => {
  const { nextBoard } = moves.removePile(board, 1 - pileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceCount });
  }, 750);
};

const getRandomStep = (board) => {
  const pileId = sample([0, 1].filter(i => board[i] >= 2));
  return { pileId, pieceCount: random(1, board[pileId] - 1) };
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

  return 1 + 2 * random(0, Math.floor((pieceCountInPile - 2) / 2));
};
