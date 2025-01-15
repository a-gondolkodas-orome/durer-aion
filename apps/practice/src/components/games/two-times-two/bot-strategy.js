'use strict';

import { sum, random } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const id = getOptimalTileIndex(board);
  moves.addPiece(board, id);
}

const getOptimalTileIndex = (board) => {
  const pieces = sum(board);

  if (pieces % 2 === 0) { //following the strategy
    if (pieces === 0) return random(0, 3);
    if (pieces === 2) { // 0,0,0,2 or 0,0,1,1
      let stack = false;
      for (let i = 0; i < 4; i++) {
        if (board[i] === 2) stack = true;
      }
      if (stack) {
        let i = 0;
        while (board[i] !== 2) i++;
        return i;
      } else {
        let ret = random(0, 3);
        while (board[ret] === 1) ret = random(0, 3);
        return ret;
      }
    }
    if (pieces === 4) { // 0,0,0,4 or 0,0,1,3 or 0,1,1,2 or 1,1,1,1 (or 0,0,2,2)
      let board2 = [...board];
      board2.sort();
      if (board2[3] >= 3) {
        let i = 0;
        while (board[i] < 3) i++;
        return i;
      } else if (board2[0] === 0) {
        let i = 0;
        while (board[i] !== 0 && i < 4) i++;
        return i;
      } else return random(0, 3);
    }
  } else { //trying to win if the player makes a mistake
    if (pieces === 1) { // 0,0,0,1
      return random(0, 3);
    }
    if (pieces === 3) { // 0,0,0,3 or 0,0,1,2 or 0,1,1,1
      let stack = false;
      for (let i = 0; i < 4; i++) {
        if (board[i] === 3) stack = true;
      }
      if (stack) {
        let ret = random(0, 3);
        while (board[ret] !== 0) ret = random(0, 3);
        return ret;
      } else {
        let ret = random(0, 3);
        while (board[ret] !== 1) ret = random(0, 3);
        return ret;
      }
    }
    if (pieces === 5) { // 0,0,2,3 or 0,1,1,3 or 0,1,2,2 (or 0,0,0,5 or 0,0,1,4 or 1,1,1,2)
      let board2 = [...board];
      board2.sort();
      if (board2[3] === 3) {
        if (board2[2] === 2) { // 0,0,2,3
          let ret = random(0, 3);
          while (board[ret] !== 0) ret = random(0, 3);
          return ret;
        } else { // 0,1,1,3
          let ret = random(0, 3);
          while (board[ret] !== 1) ret = random(0, 3);
          return ret;
        }
      } else if (board2[3] === 2 && board2[2] === 2) { // 0,1,2,2
        let ret = random(0, 3);
        while (board[ret] !== 2) ret = random(0, 3);
        return ret;
      } else return random(0, 3);
    }
  }
};
