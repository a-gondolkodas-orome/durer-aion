'use strict';

import { random, sample, range } from 'lodash';

export const randomBotStrategy = ({ board, moves }) => {
  const validMoves = [];
  for (const pileId of [0, 1]) {
    for (const pieceCount of range(2, board[pileId] + 1, 2)) {
      validMoves.push({ pileId, pieceCount });
    }
  }
  moves.moveHalvedPieces(board, sample(validMoves));
};

export const aiBotStrategy = ({ board, moves }) => {
  let pileId, pieceCount;
  if (board[0]-board[1] === -1 || board[0]-board[1] === 0 || board[0]-board[1] === 1) {
    const ran = random(0,1);
    pileId=(board[ran]>1) ? ran : (1 - ran);
    pieceCount = generateRandomEvenBetween(2, board[pileId]);

  } else {
    pileId = (board[0]>board[1]) ? 0 : 1;
    const third = Math.floor((board[pileId]-board[1-pileId]+1)/3);
    pieceCount = 2 * third;
  }

  moves.moveHalvedPieces(board, { pileId, pieceCount });
};

const generateRandomEvenBetween = (low, high) => {
  return 2 * random(Math.ceil(low / 2), Math.floor(high / 2));
};
