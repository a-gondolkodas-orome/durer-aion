import { findIndex } from 'lodash';

export const getGameStateAfterAiTurn = ({ board }) => {
  const newBoard = [...board];
  const oddPiles = [0, 1, 2].filter(i => newBoard[i] % 2 === 1);

  if (oddPiles.length === 3 || oddPiles.length === 0) {
    newBoard[findIndex(newBoard, i => i > 0)] -= 1;
  }
  if (oddPiles.length === 2) {
    newBoard[oddPiles[1]] -= 1;
    newBoard[oddPiles[0]] += 1;
  }
  if (oddPiles.length === 1) {
    newBoard[oddPiles[0]] -= 1;
  }
  return getGameStateAfterMove(newBoard);
};

export const getGameStateAfterMove = (newBoard) => {
  return { newBoard, isGameEnd: isGameEnd(newBoard), winnerIndex: null };
};

const isGameEnd = (newBoard) => newBoard[0] === 0 && newBoard[1] === 0 && newBoard[2] === 0;
