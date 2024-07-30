import { findIndex } from 'lodash';

export const getGameStateAfterAiTurn = ({ board }) => {
  const nextBoard = [...board];
  const oddPiles = [0, 1, 2].filter(i => nextBoard[i] % 2 === 1);

  if (oddPiles.length === 3 || oddPiles.length === 0) {
    nextBoard[findIndex(nextBoard, i => i > 0)] -= 1;
  }
  if (oddPiles.length === 2) {
    nextBoard[oddPiles[1]] -= 1;
    nextBoard[oddPiles[0]] += 1;
  }
  if (oddPiles.length === 1) {
    nextBoard[oddPiles[0]] -= 1;
  }
  return getGameStateAfterMove(nextBoard);
};

export const isWinningState = ({ board }) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

export const getGameStateAfterMove = (nextBoard) => {
  return { nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: null };
};

const isGameEnd = (nextBoard) => nextBoard[0] === 0 && nextBoard[1] === 0 && nextBoard[2] === 0;
