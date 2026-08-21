import { random } from 'lodash';
import { asTurn, getOptimalDivision, type Bot } from '../bot-strategy';
import type { Board } from './gameplay';

export { randomBotStrategy } from '../bot-strategy';

export const smartBotStrategy: Bot = ({ board }) => {
  const pileId = getPileToSplit(board);

  return asTurn({
    removedPileId: 1 - pileId,
    pileId,
    pieceCount: getOptimalDivision(board[pileId])
  });
};

// The split always leaves an odd half, so only an even pile can be split into
// two odd ones: prefer an even pile, and take the other only when it is a
// single piece and cannot be split at all.
const getPileToSplit = (board: Board): number => {
  const randomPileIndex = random(0, 1);

  return (board[randomPileIndex] % 2 === 0 || board[1 - randomPileIndex] === 1)
    ? randomPileIndex
    : 1 - randomPileIndex;
};
