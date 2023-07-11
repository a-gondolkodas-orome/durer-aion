'use strict';

import { random } from 'lodash';

export const getOptimalAiMove = (board) => {
  let pileId, pieceId;
  if (board[0]-board[1] === -1 || board[0]-board[1] === 0 || board[0]-board[1] === 1) {
    const ran=random(0,1);
    pileId=(board[ran]>1)
      ? ran
      : 1-ran;
    pieceId=generateRandomEvenBetween(2, board[pileId])-1;

  } else {
    let third;
    pileId=(board[0]>board[1])
      ? 0
      : 1;
    third=Math.floor((board[pileId]-board[1-pileId]+1)/3);
    pieceId=2*third-1;
  }

  return { pileId, pieceId };
};

const generateRandomEvenBetween = (low, high) => {
  return 2 * random(Math.ceil(low / 2), Math.floor(high / 2));
};
