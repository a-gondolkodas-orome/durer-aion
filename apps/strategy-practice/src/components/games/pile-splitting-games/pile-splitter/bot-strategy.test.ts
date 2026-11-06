import { runMatch } from 'strategy-game-factory';
import { botNextMoveArgs, makeCtx } from 'test-utils';
import { isLosingForMover, moves, type Board } from '../gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

// The bot picks the pile at random where the choice is free, so each board has
// to hold for every draw it can make.
const ITERATIONS = 20;

// On two piles the turn is one decision: the pile named for removal fixes the
// one to be split. Splitting leaves an odd half either way, so only an even
// pile can be cut into two odd ones — which is the whole strategy.
describe('pile-splitter smartBotStrategy', () => {
  it.each([
    { board: [3, 4], splitPileId: 1 },
    { board: [6, 5], splitPileId: 0 },
    // no even pile to prefer: split whichever one can be split at all
    { board: [1, 3], splitPileId: 1 }
  ])('discards the pile it cannot use, from $board', ({ board, splitPileId }) => {
    for (let i = 0; i < ITERATIONS; i++) {
      const [removedPileId] = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));
      expect(removedPileId).toEqual(1 - splitPileId);
    }
  });
});

// A full-strength optimality check, end to end: from a position the mover can
// win the smart bot must win as the mover, and from one it cannot every turn
// loses, so it must win as the replier whatever the random bot throws at it.
// See AGENTS.md § Testing.
describe('pile-splitter smartBotStrategy against the random bot', () => {
  const startBoards: Board[] = [
    [4, 7], [10, 10], [2, 3], [1, 4], [6, 6], [3, 5], [9, 9], [1, 3]
  ];

  const winnerAgainstRandom = (startBoard: Board, smartSeat: 0 | 1) => runMatch({
    gameplay: { moves },
    strategies: smartSeat === 0
      ? [smartBotStrategy, randomBotStrategy]
      : [randomBotStrategy, smartBotStrategy],
    startBoard
  }).winnerIndex;

  it.each(startBoards)('wins from %j as the role that can force it', (...startBoard) => {
    const smartSeat = isLosingForMover(startBoard) ? 1 : 0;

    for (let i = 0; i < ITERATIONS; i++) {
      expect(winnerAgainstRandom(startBoard, smartSeat)).toEqual(smartSeat);
    }
  });
});
