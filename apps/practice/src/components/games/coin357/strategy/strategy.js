import { findIndex } from 'lodash-es';

export const generateNewBoard = () => ([3, 5, 7]);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  if (oddPiles.length === 3 || oddPiles.length === 0) {
    board[findIndex(board, i => i > 0)] -= 1;
  }
  if (oddPiles.length === 2) {
    board[oddPiles[1]] -= 1;
    board[oddPiles[0]] += 1;
  }
  if (oddPiles.length === 1) {
    board[oddPiles[0]] -= 1;
  }
  return getGameStateAfterMove(board);
};

export const getGameStateAfterMove = (board) => {
  return { board, isGameEnd: isGameEnd(board) };
};

const isGameEnd = (board) => board[0] === 0 && board[1] === 0 && board[2] === 0;
