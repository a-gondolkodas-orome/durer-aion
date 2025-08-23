import { sample, cloneDeep } from 'lodash';
import { Thief, hasWinningTriple, getUntakenCards } from '../helpers';

export const aiBotStrategy = ({ board, moves, ctx }) => {
    const move = getMove(board, ctx.chosenRoleIndex);
    moves.takeCard(board, move);
}

const getMove = (board, chosenRoleIndex) => {
  const allowedMoves = getUntakenCards(board, 9);
  if (chosenRoleIndex === 1 && getUntakenCards.length === 9) return 5;
  const optimalMoves = allowedMoves.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy.cards[1 - chosenRoleIndex].push(i);
    boardCopy.numTurns += 1;
    return isWinningState(boardCopy, chosenRoleIndex === 1);
  })
  if (optimalMoves.length > 0) return sample(optimalMoves);
  return sample(allowedMoves);
}

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIFirst) => {
  if (isGameEnd(board)) {
    return amIFirst !== hasWinningTriple(board.cards[Thief]);
  }
  const allowedPlaces = getUntakenCards(board, 9);

  const optimalPlaceForOther = allowedPlaces.find(i => {
    const boardCopy = cloneDeep(board);
    boardCopy.cards[amIFirst ? 1 : 0].push(i);
    boardCopy.numTurns += 1;
    return isWinningState(boardCopy, !amIFirst);
  });
  return optimalPlaceForOther === undefined;
};

const isGameEnd = board => {
  return board.numTurns === 8 || hasWinningTriple(board.cards[Thief]);
}
