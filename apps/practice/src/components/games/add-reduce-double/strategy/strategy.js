'use strict';

import { random, isEqual } from 'lodash-es';
import { generateRandomEvenBetween } from '../../../../lib/generate-random';

export const generateNewBoard = () => ([random(3, 10), random(3, 10)]);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  return getGameStateAfterMove(board, getAiStep(board));
};

export const getGameStateAfterMove = (board, { pileId, pieceId }) => {

  let newBoard;
  if(pileId===0) {
    newBoard = [board[0] - pieceId - 1, board[1]+(pieceId+1)/2];
  } else {
    newBoard = [board[0] +(pieceId+1)/2, board[1]-pieceId-1];
  }

  return {
    board: newBoard,
    isGameEnd: isEqual(newBoard, [1, 1]) || isEqual(newBoard, [0, 1]) || isEqual(newBoard, [1, 0])
  };
};

const getAiStep = (board) => {
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
