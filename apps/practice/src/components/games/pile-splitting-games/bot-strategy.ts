import { random, range, sample } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { isRemovalAllowed, isSplitAllowed, withPileRemoved, type Board, type Moves } from './gameplay';

// A turn is one decision expressed as two moves: which pile to discard, and
// where to cut one of those left.
export type BotStep = { removedPileId: number; pileId: number; pieceCount: number };

export type Bot = BotStrategy<Board, Moves>


export const asTurn = ({ removedPileId, pileId, pieceCount }: BotStep): BotMove<Moves>[] => [
  { move: 'removePile', args: [removedPileId] },
  { move: 'splitPile', args: [{ pileId, pieceCount }] }
];

// Play a legal turn picked at random, on however many piles the board has: the
// two halves of the turn are enumerated with the rules' own predicates rather
// than with a restated "a pile of 2+ can be split".
export const randomBotStrategy: Bot = ({ board }) => {
  const removedPileId = sample(range(board.length).filter(i => isRemovalAllowed(board, i)))!;
  const afterRemoval = withPileRemoved(board, removedPileId);
  // Cutting one piece off is the least a split can be, so a pile that allows it
  // is exactly a pile that can be split at all.
  const pileId = sample(range(board.length).filter(i => isSplitAllowed(afterRemoval, i, 1)))!;

  return asTurn({ removedPileId, pileId, pieceCount: random(1, board[pileId] - 1) });
};
