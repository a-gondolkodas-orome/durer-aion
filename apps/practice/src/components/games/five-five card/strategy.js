'use strict';

import { isNull, cloneDeep } from 'lodash';

export const getGameStateAfterAiTurn = ({ board, ctx }) => {
  const nextBoard = cloneDeep(board);
  nextBoard[getOptimalAiPlacingPosition(board, ctx.chosenRoleIndex)] = 'removed';
  return getGameStateAfterMove(nextBoard);
};

export const getGameStateAfterMove = (nextBoard) => {
  return { nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 };
};

const isGameEnd = (board) => {
  if (board.filter(c => c).length === 8) return true;
  return false;
};

const hasFirstPlayerWon = (board) => {
  if (!isGameEnd(board)) return undefined;
  let firstPlayerNumber = -1, secondPlayerNumber = -1;
  for (let i = 0; i < 15; i+= 3){
    if (isNull(board[i])){
      firstPlayerNumber = Math.floor(i / 3 + 1);
    }
  }
  for (let i = 2; i < 15; i+= 3){
    if (isNull(board[i])){
      secondPlayerNumber = Math.floor(i / 3 + 1);
    }
  }

  if (firstPlayerNumber == secondPlayerNumber) return true;
  if ((firstPlayerNumber + secondPlayerNumber) % 2 == 0){
    return firstPlayerNumber < secondPlayerNumber;
  }
  else {
    return firstPlayerNumber > secondPlayerNumber;
  }
};

const getIfWinningPosition = (i, j, chosenRoleIndex) => {
  if (i == j){
    return chosenRoleIndex == 1;
  }
  if ((i + j) % 2 == 0){
    return i < j;
  }
  if ((i + j) % 2 == 1){
    return i > j;
  }
}

const getOptimalAiPlacingPosition = (board, chosenRoleIndex) => {
  let firstPlayersPossibleMoves = [];
  let secondPlayersPossibleMoves = [];
  for (let i = 0; i < 15; i++){
    if (i % 3 == 0){
      if (isNull(board[i])) {
        secondPlayersPossibleMoves.push(Math.floor(i / 3 + 1));
      }
    }
    if (i % 3 == 2){
      if (isNull(board[i])) {
        firstPlayersPossibleMoves.push(Math.floor(i / 3 + 1));
      }
    }
  }
  // as a first player still try to win if second player may not play optimally
  if (chosenRoleIndex === 1) {
    let possibleWinningMoves = [];
    for (const i of firstPlayersPossibleMoves){
      let isIsolatedPoint = true;
      for (const j of secondPlayersPossibleMoves){
        if (getIfWinningPosition(i, j, 1 - chosenRoleIndex)){
          isIsolatedPoint = false;
        }
      }
      if (!isIsolatedPoint){
        possibleWinningMoves.push(i);
      }
    }
    // if no winning move make a random move
    if (possibleWinningMoves.length == 0){
      const rand = Math.floor(Math.random()*firstPlayersPossibleMoves.length)%firstPlayersPossibleMoves.length;
      return (firstPlayersPossibleMoves[rand] - 1) * 3 + 2;
    }
    // make a possibly winning move
    const rand = Math.floor(Math.random()*possibleWinningMoves.length)%possibleWinningMoves.length;
    return (possibleWinningMoves[rand] - 1) * 3 + 2;
  }

  // as a second player proceed with placing at an empty place symmetrical to player's piece

  if (chosenRoleIndex === 0) {
    let winningMoves = [];
    let badMoves = [];
    // calculate wrong moves
    for (const j of firstPlayersPossibleMoves){
      let winningPairs = [];
      for (const i of secondPlayersPossibleMoves){
        if (getIfWinningPosition(j, i, chosenRoleIndex)){
          winningPairs.push(i);
        }
      }
      if (winningPairs.length > 0){
        const rand = Math.floor(Math.random()*winningPairs.length)%winningPairs.length;
        badMoves.push(winningPairs[rand]);
      }
    }
    for (const i of secondPlayersPossibleMoves){
      let isGoodMove = true;
      for (const j of badMoves){
        if (i === j) isGoodMove = false;
      }
      if (isGoodMove == true) winningMoves.push(i);
    }
    // if no winning move make a random move (not possible)
    if (winningMoves.length == 0){
      console.log("Error in strategy...");
      const rand = Math.floor(Math.random()*secondPlayersPossibleMoves.length)%secondPlayersPossibleMoves.length;
      return (secondPlayersPossibleMoves[rand] - 1) * 3;
    }
    // make a winning move
    const rand = Math.floor(Math.random()*winningMoves.length)%winningMoves.length;
    return (winningMoves[rand] - 1) * 3;
  }
};
