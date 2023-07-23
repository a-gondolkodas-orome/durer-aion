'use strict';

import { isNull, some, range, groupBy, sample, cloneDeep } from 'lodash';

const roleColors = ['red', 'blue'];

export const playerColor = playerIndex => playerIndex === 0 ? roleColors[0] : roleColors[1];
const aiColor = playerIndex => playerIndex === 0 ? roleColors[1] : roleColors[0];

export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const newBoard = cloneDeep(board);
  newBoard[getOptimalAiPlacingPosition(board, playerIndex)] = aiColor(playerIndex);
  return getGameStateAfterMove(newBoard);
};

export const getGameStateAfterMove = (newBoard) => {
  return { newBoard, isGameEnd: isGameEnd(newBoard), winnerIndex: hasFirstPlayerWon(newBoard) ? 0 : 1 };
};

const isGameEnd = (board) => {
  if (board.filter(c => c).length === 4) return true;
  return false;
}; 

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;
  const pairs = [[6, 2], [0, 5], [3, 8]];
  for (const p of pairs) {
    
    // first is occupied, second is not from given pair
    if (isNull(board[p[0]]) && isNull(board[p[1]])) {
      return false;
    }
  }
  return true;
};

const getOptimalAiPlacingPosition = (board, playerIndex) => {
  const allowedPlaces = range(0, 9).filter(i => i != 1 && i!= 4 && i != 7 && isNull(board[i]));

  let freePlaces = [];
  for (let i = 0; i <= 8; i++){
    if (i == 1 || i == 4 || i == 7) continue;
    if (isNull(board[i])) {
      freePlaces.push(i);
    }
  }

  // start with a random place as a first step
  if (allowedPlaces.length === 6) {
    const rand = Math.floor(Math.random()*100)%3;
    if (rand == 0) return 2;
    if (rand == 1) return 5;
    if (rand == 2) return 8;
  }

  // as a first player still try to win if first player may not play optimally
  if (playerIndex === 1) {
    // pairs to still have chance
    const pairs = [[0, 8], [3, 2], [6, 5], [0, 2], [3, 5], [6, 8]];
    for (const p of pairs) {
      
      // first is occupied, second is not from given pair
      if (!isNull(board[p[0]]) && isNull(board[p[1]])) {
        return p[1];
      }
    }
  }

  // as a second player proceed with chosing useless player's piece

  if (playerIndex === 0) {
    // pairs beating each other
    const pairs = [[0, 5], [3, 8], [6, 2]];
    for (const p of pairs) {
      // first is not occupied, second is occupied from given pair
      if (isNull(board[p[0]]) && !isNull(board[p[1]])) {
        return p[0];
      }
    }
  }
};