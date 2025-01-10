'use strict';

import { sample, compact } from 'lodash';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const idx = getOptimalAiMove(board, ctx.chosenRoleIndex);
  moves.removeCard(board, idx);
};

const isWinningPosition = (i, j, chosenRoleIndex) => {
  if (i === j){
    return chosenRoleIndex === 1;
  }
  if ((i + j) % 2 === 0){
    return i < j;
  }
  if ((i + j) % 2 === 1){
    return i > j;
  }
}

export const getOptimalAiMove = (board, chosenRoleIndex) => {
  const firstPlayersPossibleMoves = compact(board[1]);
  const secondPlayersPossibleMoves = compact(board[0]);
  // as a first player still try to win if second player may not play optimally
  if (chosenRoleIndex === 1) {
    let possibleWinningMoves = [];
    for (const i of firstPlayersPossibleMoves){
      let isIsolatedPoint = true;
      for (const j of secondPlayersPossibleMoves){
        if (isWinningPosition(i, j, 1 - chosenRoleIndex)){
          isIsolatedPoint = false;
        }
      }
      if (!isIsolatedPoint){
        possibleWinningMoves.push(i);
      }
    }
    // if no winning move make a random move
    if (possibleWinningMoves.length === 0){
      return sample(firstPlayersPossibleMoves);
    }
    // make a possibly winning move
    return sample(possibleWinningMoves)
  }

  // as a second player proceed with placing at an empty place symmetrical to player's piece

  if (chosenRoleIndex === 0) {
    let winningMoves = [];
    let badMoves = [];
    // calculate wrong moves
    for (const j of firstPlayersPossibleMoves){
      let winningPairs = [];
      for (const i of secondPlayersPossibleMoves){
        if (isWinningPosition(j, i, chosenRoleIndex)){
          winningPairs.push(i);
        }
      }
      if (winningPairs.length > 0){
        badMoves.push(sample(winningPairs));
      }
    }
    for (const i of secondPlayersPossibleMoves){
      let isGoodMove = true;
      for (const j of badMoves){
        if (i === j) isGoodMove = false;
      }
      if (isGoodMove === true) winningMoves.push(i);
    }
    // if no winning move make a random move (not possible)
    if (winningMoves.length === 0){
      console.log("Error in strategy...");
      return sample(secondPlayersPossibleMoves);
    }
    // make a winning move
    return sample(winningMoves);
  }
};
