import { random, range, sample } from 'lodash';
import { asTurn, getOptimalDivision, type Bot, type BotStep } from '../bot-strategy';
import type { Board } from './gameplay';

export { randomBotStrategy } from '../bot-strategy';

export const smartBotStrategy: Bot = ({ board }) => asTurn(getSmartBotStep(board));

// Leaving all four piles odd is what the opponent cannot answer, and a turn
// reaches it whenever one or two piles are even: cut one of them into two odd
// halves, and discard the second even pile if there is one. Past two even piles
// no turn reaches it and the position reduces instead — the same reductions
// `isLosingForMover` reads it by.
export const getSmartBotStep = (board: Board): BotStep => {
  const evenPileIds = range(4).filter(id => board[id] % 2 === 0);

  const cutInTwo = (splitPileId: number, removedPileId: number): BotStep => ({
    removedPileId,
    pileId: splitPileId,
    pieceCount: getOptimalDivision(board[splitPileId])
  });

  // Every pile odd: the position is lost whatever follows, so the turn only has
  // to be legal — split whatever still has two pieces to give.
  if (evenPileIds.length === 0) {
    const splitPileId = sample(range(4).filter(id => board[id] !== 1))!;
    return cutInTwo(splitPileId, (splitPileId + 1) % 4);
  }

  if (evenPileIds.length <= 2) {
    const splitPileId = sample(evenPileIds)!;
    // Discard the second even pile where there is one: leaving it standing is
    // what would keep a pile of the wrong parity on the board.
    const secondEvenPileIds = evenPileIds.filter(id => id !== splitPileId);
    const removable = secondEvenPileIds.length > 0
      ? secondEvenPileIds
      : range(4).filter(id => id !== splitPileId);
    return cutInTwo(splitPileId, sample(removable)!);
  }

  if (evenPileIds.length === 3) {
    const oddPileId = range(4).find(id => board[id] % 2 === 1)!;
    // [1, 2, 2, 2] is the one position the reduction below cannot be read back
    // off: topping the odd pile up gives four 2s, whose branch picks the pile to
    // split at random and so may pick the one that is really a single piece.
    // The position is lost anyway, so any legal turn will do.
    if (board[oddPileId] === 1 && board.filter(size => size === 2).length === 3) {
      return cutInTwo((oddPileId + 1) % 4, (oddPileId + 2) % 4);
    }
    // Topping the lone odd pile up to even leaves the win/loss class alone, and
    // the turn that beats the topped-up board beats this one unchanged: the
    // piles it splits and discards are the same size here, bar the topped-up
    // one, which comes back a piece short in whichever half it lands.
    return getSmartBotStep(board.map((size, id) => id === oddPileId ? size + 1 : size));
  }

  // Every pile even, so halving is the same position one scale down — except
  // for four 2s, which halves to a board nobody can move on and so is played
  // out here instead.
  if (board.every(size => size === 2)) {
    const splitPileId = random(0, 3);
    return cutInTwo(splitPileId, (splitPileId + 1) % 4);
  }

  const botStep = getSmartBotStep(board.map(size => size / 2));
  return { ...botStep, pieceCount: botStep.pieceCount * 2 };
};
