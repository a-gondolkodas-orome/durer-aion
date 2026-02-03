import { findIndex } from 'lodash';

export const aiBotStrategy = ({ board, moves }) => {
  const { remove, add } = botMoveParams({ board });
  const { nextBoard } = moves.removeCoin(board, remove);
  if (add === undefined) return;
  if (add === null) {
    setTimeout(() => {
      moves.addCoin(nextBoard, null);
    }, 0);
  } else {
    setTimeout(() => {
      moves.addCoin(nextBoard, add);
    }, 750);
  }
};

export const botMoveParams = ({ board }) => {
  const oddPiles = [1, 2, 3].filter(i => board[i - 1] % 2 === 1);

  if (oddPiles.length === 2) {
    return { remove: oddPiles[1], add: oddPiles[0] };
  }

  const valueToRemove = oddPiles.length === 1
    ? oddPiles[0]
    : (findIndex(board, i => i > 0) + 1);

  return { remove: valueToRemove, add: valueToRemove !== 1 ? null : undefined };
}
