'use strict';

import { random, range, sample } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const botStep = getAiStep(board);
  executeBotStrategy(botStep, { board, moves });
};

export const randomBotStrategy = ({ board, moves }) => {
  const botStep = getRandomStep(board);
  executeBotStrategy(botStep, { board, moves });
};

const executeBotStrategy = ({ removedPileId, pileId, pieceCount }, { board, moves }) => {
  const { nextBoard } = moves.removePile(board, removedPileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceCount });
  }, 750);
};

const getRandomStep = (board) => {
  const pileId = sample([0, 1, 2, 3].filter(i => board[i] >= 2));
  const removedPileId = sample([0, 1, 2, 3].filter(i => i !== pileId));
  const pieceCount = random(1, board[pileId] - 1);
  return { removedPileId, pileId, pieceCount };
};

export const getAiStep = (board) => {
  const start = random(0, 3);
  let removedPileId, splitPileId;

  const odds = board.filter(p => p % 2 === 1).length;

  if (odds === 4) {
    const notSinglePileIndices = range(0, 4).filter(i => board[i] !== 1);
    const first = sample(notSinglePileIndices);
    removedPileId = (first + 1) % 4;
    splitPileId = first;
  }

  if (odds === 3) {
    const evenPileIndex = range(0, 4).find(i => board[i] % 2 === 0);
    removedPileId = (evenPileIndex + 1) % 4;
    splitPileId = evenPileIndex;
  }

  if (odds === 2) {
    const evenPileIndices = range(0, 4).filter(i => board[i] % 2 === 0);
    removedPileId = evenPileIndices[1];
    splitPileId = evenPileIndices[0];
  }

  if (odds === 1) {
    const oddPile = range(0, 4).find(i => board[i] % 2 === 1);
    if (
      board[oddPile] === 1 && board[(oddPile + 1) % 4] === 2 &&
      board[(oddPile + 2) % 4] === 2 && board[(oddPile + 3) % 4] === 2
    ) {
      removedPileId = (oddPile + 2) % 4;
      splitPileId = (oddPile + 1) % 4;
    } else {
      const modifiedBoard = [...board];
      modifiedBoard[oddPile] += 1;
      const aiStep = getAiStep(modifiedBoard);
      return {
        removedPileId: aiStep.removedPileId,
        pileId: aiStep.pileId,
        pieceCount: aiStep.pieceCount - 1
      }
    }
  }

  if (odds === 0) {
    if (board[0] === 2 && board[1] === 2 && board[2] === 2 && board[3] === 2) {
      removedPileId = (start + 1) % 4;
      splitPileId = start;
    } else {
      const aiStep = getAiStep(board.map((x) => x / 2));
      return { ...aiStep, pieceCount: aiStep.pieceCount * 2 };
    }
  }

  return {
    removedPileId,
    pileId: splitPileId,
    pieceCount: getOptimalDivision(board, splitPileId)
  }
};

const getOptimalDivision = function (board, pileId) {
  const sum = board[pileId];

  if (sum === 2) return 1;

  return 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));
};
