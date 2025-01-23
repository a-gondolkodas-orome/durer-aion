import { findIndex } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const oddPiles = [1, 2, 3].filter(i => board[i - 1] % 2 === 1);

  if (oddPiles.length === 3 || oddPiles.length === 0) {
    const valueToRemove = findIndex(board, i => i > 0) + 1;
    const { nextBoard } = moves.removeCoin(board, valueToRemove);
    if (valueToRemove !== 1) {
      setTimeout(() => {
        moves.addCoin(nextBoard, null);
      }, 0)
    }
  }
  if (oddPiles.length === 2) {
    const { nextBoard } = moves.removeCoin(board, oddPiles[1]);
    setTimeout(() => {
      moves.addCoin(nextBoard, oddPiles[0]);
    }, 750)
  }
  if (oddPiles.length === 1) {
    const { nextBoard } = moves.removeCoin(board, oddPiles[0]);
    if (oddPiles[0] !== 1) {
      setTimeout(() => {
        moves.addCoin(nextBoard, null);
      }, 0)
    }
  }
};
