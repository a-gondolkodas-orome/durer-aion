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

const executeBotStrategy = ({ removedPileId, pileId, pieceCount }, { board, moves }) => {
  const { nextBoard } = moves.removePile(board, removedPileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceCount });
  }, 750);
};

const getRandomStep = (board) => {
  const pileId = sample([0, 1, 2].filter(i => board[i] >= 2));
  const removedPileId = sample([0, 1, 2].filter(i => i !== pileId));
  const pieceCount = random(1, board[pileId] - 1);
  return { removedPileId, pileId, pieceCount };
};

export const getAiStep = (board) => {
  const start = random(0, 2);
  let removedPileId, splitPileId;

  if (board[0] % 2 === 1 || board[1] % 2 === 1 || board[2] % 2 === 1) {
    if (board[start] % 2 === 0) {
      if (board[(start + 1) % 3] % 2 === 0) {
        removedPileId = (start + 1) % 3;
        splitPileId = start;
      } else {
        removedPileId = (start + 2) % 3;
        splitPileId = start;
      }
    } else if (board[(start + 1) % 3] % 2 === 0) {
      removedPileId = (start + 2) % 3;
      splitPileId = (start + 1) % 3;
    } else if (board[(start + 2) % 3] % 2 === 0) {
      removedPileId = (start + 1) % 3;
      splitPileId = (start + 2) % 3;
    } else {
      if (board[start] !== 1) {
        removedPileId = (start + 1) % 3;
        splitPileId = start;
      } else if (board[(start + 1) % 3] !== 1) {
        removedPileId = (start + 2) % 3;
        splitPileId = (start + 1) % 3;
      } else {
        removedPileId = start;
        splitPileId = (start + 2) % 3;
      }
    }
    return {
      removedPileId,
      pileId: splitPileId,
      pieceCount: getOptimalDivision(board, splitPileId)
    }
  } else if (board[0] === 2 && board[1] === 2 && board[2] === 2) {
    return {
      removedPileId: (start + 1) % 3,
      pileId: start,
      pieceCount: getOptimalDivision(board, start)
    }
  } else {
    //this is the case where all piles have even number of pieces
    //should not occur in an optimal game with 37 pieces
    //with this the enemy also has a strategy when the game starts with 36 pieces
    const aiStep = getAiStep(board.map((x) => x / 2));
    return { ...aiStep, pieceCount: aiStep.pieceCount * 2 };
  }
};

const getOptimalDivision = function (board, pileId) {
  const sum = board[pileId];

  if (sum === 2) return 1;

  return 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));
};
