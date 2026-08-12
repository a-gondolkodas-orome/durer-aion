import { random, range, sample } from 'lodash';
import { asTurn, getOptimalDivision, type Bot, type BotStep } from '../bot-strategy';
import type { Board } from './gameplay';

export { randomBotStrategy } from '../bot-strategy';

export const smartBotStrategy: Bot = ({ board }) => asTurn(getSmartBotStep(board));

// Leaving all three piles odd is what the opponent cannot answer, and a turn
// reaches it whenever one or two piles are even: cut one of them into two odd
// halves, and discard the second even pile if there is one. With every pile
// even no turn reaches it and the position reduces instead — the same reduction
// `isLosingForMover` reads it by.
export const getSmartBotStep = (board: Board): BotStep => {
  const evenPileIds = range(3).filter(id => board[id] % 2 === 0);

  const cutInTwo = (splitPileId: number, removedPileId: number): BotStep => ({
    removedPileId,
    pileId: splitPileId,
    pieceCount: getOptimalDivision(board[splitPileId])
  });

  // Every pile odd: the position is lost whatever follows, so the turn only has
  // to be legal — split whatever still has two pieces to give.
  if (evenPileIds.length === 0) {
    const splitPileId = sample(range(3).filter(id => board[id] !== 1))!;
    return cutInTwo(splitPileId, (splitPileId + 1) % 3);
  }

  if (evenPileIds.length < 3) {
    const splitPileId = sample(evenPileIds)!;
    // Discard the second even pile where there is one: leaving it standing is
    // what would keep a pile of the wrong parity on the board.
    const secondEvenPileIds = evenPileIds.filter(id => id !== splitPileId);
    const removable = secondEvenPileIds.length > 0
      ? secondEvenPileIds
      : range(3).filter(id => id !== splitPileId);
    return cutInTwo(splitPileId, sample(removable)!);
  }

  // Every pile even, so halving is the same position one scale down — except
  // for three 2s, which halves to a board nobody can move on and so is played
  // out here instead. The 37-piece start is odd, so an optimal line never
  // reaches this branch: it is what keeps the bot playing well after the
  // opponent has left one.
  if (board.every(size => size === 2)) {
    const splitPileId = random(0, 2);
    return cutInTwo(splitPileId, (splitPileId + 1) % 3);
  }

  const botStep = getSmartBotStep(board.map(size => size / 2));
  return { ...botStep, pieceCount: botStep.pieceCount * 2 };
};
