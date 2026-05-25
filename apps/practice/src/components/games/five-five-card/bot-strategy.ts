import { sample, compact, range } from 'lodash';
import type { StrategyArgs } from '../../game-factory/types';
import type { Board } from './five-five-card';

export const randomBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const opponentIdx = ctx.chosenRoleIndex!;
  const validIds = range(1, 6).filter(id => board[opponentIdx][id - 1] !== null);
  moves.removeCard(board, sample(validIds));
};

export const aiBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const idx = getOptimalAiMove(board, ctx.chosenRoleIndex);
  moves.removeCard(board, idx);
};

const isWinningPosition = (i, j, chosenRoleIndex): boolean => {
  if (i === j){
    return chosenRoleIndex === 1;
  }
  if ((i + j) % 2 === 0){
    return i < j;
  } else { // (i + j) % 2 === 1
    return i > j;
  }
}

export const getOptimalAiMove = (board: Board, opponentIndex) => {
  const firstPlayersPossibleMoves = compact(board[1]);
  const secondPlayersPossibleMoves = compact(board[0]);
  // as a first player still try to win if second player may not play optimally
  if (opponentIndex === 1) {
    let possibleWinningMoves: number[] = [];
    for (const i of firstPlayersPossibleMoves){
      let isIsolatedPoint = true;
      for (const j of secondPlayersPossibleMoves){
        if (isWinningPosition(i, j, 1 - opponentIndex)){
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

  if (opponentIndex === 0) {
    let winningMoves: number[] = [];
    let badMoves: number[] = [];
    // calculate wrong moves
    for (const j of firstPlayersPossibleMoves){
      let winningPairs: number[] = [];
      for (const i of secondPlayersPossibleMoves){
        if (isWinningPosition(j, i, opponentIndex)){
          winningPairs.push(i);
        }
      }
      if (winningPairs.length > 0){
        badMoves.push(sample(winningPairs)!);
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
