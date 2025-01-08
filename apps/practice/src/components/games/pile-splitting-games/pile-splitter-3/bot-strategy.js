'use strict';

import { random } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const { removedPileId, pileId, pieceCount } = getAiStep(board);
  const { nextBoard } = moves.removePile(board, removedPileId);
  setTimeout(() => {
    moves.splitPile(nextBoard, { pileId, pieceCount });
  }, 750)
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
