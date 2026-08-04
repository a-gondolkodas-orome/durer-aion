import { random, sample } from 'lodash';
import type { BotMove, BotStrategy } from '../../../strategy-game-factory';
import type { Board, moves } from './pile-splitter';

type MoveName = keyof typeof moves
type Bot = BotStrategy<Board, MoveName>

// A turn is one decision expressed as two moves: which pile to keep, and where
// to cut it.
const asTurn = (pileId: number, pieceCount: number): BotMove<MoveName>[] => [
  { move: 'removePile', args: [1 - pileId] },
  { move: 'splitPile', args: [{ pileId, pieceCount }] }
];

export const smartBotStrategy: Bot = ({ board }) => {
  const pileId = getPileToSplit(board);
  return asTurn(pileId, getOptimalDivision(board[pileId]));
};

export const randomBotStrategy: Bot = ({ board }) => {
  const pileId = sample([0, 1].filter(i => board[i] >= 2))!;
  return asTurn(pileId, random(1, board[pileId] - 1));
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

const getOptimalDivision = (pieceCountInPile: number): number => {
  if (pieceCountInPile === 2) return 1;

  return 1 + 2 * random(0, Math.floor((pieceCountInPile - 2) / 2));
};
