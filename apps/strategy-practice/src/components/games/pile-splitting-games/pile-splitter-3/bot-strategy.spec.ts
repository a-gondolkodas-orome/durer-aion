import { runMatch } from 'strategy-game-factory';
import { isLosingForMover, moves, type Board } from '../gameplay';
import { getSmartBotStep, randomBotStrategy, smartBotStrategy } from './bot-strategy';

// getSmartBotStep picks an internal random `start` in 0..2, so each assertion must
// hold for every possible start: loop enough times to exercise all branches.
const ITERATIONS = 60;

describe('getSmartBotStep', () => {
  it('odd, odd, odd case: split a non-1 pile', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const botStep = getSmartBotStep([1, 3, 1]);
      expect(botStep.pileId).toEqual(1);
    }
  });

  it('odd, odd, even case: split the even pile into odd-odd', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const botStep = getSmartBotStep([3, 5, 4]);
      expect(botStep.pileId).toEqual(2);
      expect([1, 3]).toContainEqual(botStep.pieceCount);
      // the removed pile must be a different, real pile (never the one being split)
      expect([0, 1]).toContainEqual(botStep.removedPileId);
    }
  });

  it('odd, even, even case: remove one even, split the other into odd-odd', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const botStep = getSmartBotStep([4, 4, 3]);
      expect([0, 1]).toContainEqual(botStep.pileId);
      expect([1, 3]).toContainEqual(botStep.pieceCount);
      // remove the other even pile, never the one being split nor the odd pile (2)
      expect([0, 1]).toContainEqual(botStep.removedPileId);
      expect(botStep.removedPileId).not.toEqual(botStep.pileId);
    }
  });

  it('even, even, even case: follow strategy for halfed piles', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const botStep = getSmartBotStep([10, 14, 4]);
      expect(botStep.pileId).toEqual(2);
      expect(botStep.pieceCount).toEqual(2);
      // halved board [5,7,2] is odd,odd,even: split pile 2, remove an odd pile
      expect([0, 1]).toContainEqual(botStep.removedPileId);
    }
  });
});

// A full-strength optimality check, end to end: from a position the mover can
// win the smart bot must win as the mover, and from one it cannot every turn
// loses, so it must win as the replier whatever the random bot throws at it.
// See AGENTS.md § Testing.
describe('pile-splitter-3 smartBotStrategy', () => {
  const startBoards: Board[] = [
    [3, 5, 4], [2, 4, 6], [1, 1, 4], [6, 10, 21], [5, 16, 16],
    [5, 15, 17], [9, 9, 9], [4, 4, 4], [11, 13, 13]
  ];

  const winnerAgainstRandom = (startBoard: Board, smartSeat: 0 | 1) => runMatch({
    gameplay: { moves },
    strategies: smartSeat === 0
      ? [smartBotStrategy, randomBotStrategy]
      : [randomBotStrategy, smartBotStrategy],
    startBoard
  }).winnerIndex;

  it.each(startBoards)('wins from %j as the role that can force it', (...startBoard) => {
    // Both bots shuffle among their choices, so the board has to hold for every
    // line the pair of them can produce.
    const smartSeat = isLosingForMover(startBoard) ? 1 : 0;

    for (let i = 0; i < 10; i++) {
      expect(winnerAgainstRandom(startBoard, smartSeat)).toEqual(smartSeat);
    }
  });
});
