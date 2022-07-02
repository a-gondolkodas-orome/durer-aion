'use strict';

import { random, sum, cloneDeep } from 'lodash-es';

//following the strategy
export const getOptimalTileIndices = (board) => {
  const pieces = sum(board);
  let board2 = cloneDeep(board);
  board2.sort();

  if(pieces === 2){ // 0,0,0,1,1 or 0,0,0,0,2
    if(board2[4] === 2){
      const i = findSquare(board,0);
      return [i,i];
    }
    else{
      return findSquares(board,1,1);
    }
  }
  else if(pieces === 5){ // 0,0,1,2,2 or 0,0,0,2,3
    if(random(1) === 0){ // make 0,0,1,3,3
      if(board2[4] === 2){
        return findSquares(board,2,2);
      }
      else{
        return [findSquare(board,0),findSquare(board,2)];
      }
    }
    else{ // make 0,0,2,2,3
      if(board2[4] === 2){
        return [findSquare(board,1),findSquare(board,2)];
      }
      else{
        const i = findSquare(board,0);
        return [i,i];
      }
    }
  }
  else if(pieces === 8){ // 0,1,2,2,3 or 0,1,1,3,3 or 0,0,2,3,3 or 0,0,2,2,4 or 0,0,1,3,4
    if(board2[4] === 4){
      if(board2[3] === 3){ // 0,0,1,3,4
        const i = findSquare(board,0);
        return [i,i];
      }
      else{ // 0,0,2,2,4
        return [findSquare(board,0),findSquare(board,2)];
      }
    }
    else if(board2[3] === 3){
      if(board2[2] === 2){ // 0,0,2,3,3
        return [findSquare(board,0),findSquare(board,3)];
      }
      else{ // 0,1,1,3,3
        return [findSquare(board,1),findSquare(board,3)];
      }
    }
    else{ // 0,1,2,2,3
      const i = findSquare(board,2);
      return [i,i];
    }
  }
  else alert("illegal state");
}

//trying to win if the player makes a mistake
export const getOptimalTileIndex = (board) => {
  const pieces = sum(board);
  let board2 = cloneDeep(board);
  board2.sort();

  if(pieces === 1){ // (0,0,0,0,1)
    return random(4);
  }
  else if(pieces === 4){ // (0,1,1,1,1) or 0,0,1,1,2 or (0,0,0,2,2) or 0,0,0,1,3 or (0,0,0,0,4)
    if(board2[4] === 3){
      return findSquare(board,3);
    }
    else if(board2[4] === 2 && board2[3] === 1){
      return findSquare(board,0);
    }
    else{
      return random(4);
    }
  }
  else if(pieces === 7){ // (1,1,1,2,2) or 0,1,2,2,2 or (1,1,1,1,3) or 0,1,1,2,3 or (0,0,2,2,3) or (0,0,1,3,3) or 0,1,1,1,4 or 0,0,1,2,4 or 0,0,0,3,4 or (0,0,1,1,5) or (0,0,0,2,5) or (0,0,0,1,6) or (0,0,0,0,7)
    if(board2[4] === 4){
      return findSquare(board,4);
    }
    else if(board2[0] === 0 && board2[1] !== 0){
      return findSquare(board,0);
    }
    else{
      return random(4);
    }
  }
  else alert("illegal state");
}

// finds a square with n pieces randomly
const findSquare = (board,n) => {
  let ret = random(4);
  while (board[ret] !== n) ret = random(4);
  return ret;
}

// finds the squares with values n and k
// n and k does not need to be different but there must be exactly 2 such squares
const findSquares = (board,n,k) => {
  let i1 = 0;
  while (board[i1] !== n || board[i1] !== k) i1++;
  let i2 = i1+1;
  while (board[i2] !== n || board[i2] !== k) i2++;
  return [i1,i2];
}
