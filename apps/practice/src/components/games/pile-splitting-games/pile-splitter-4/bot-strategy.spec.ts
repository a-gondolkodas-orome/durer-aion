import { runMatch } from 'strategy-game-factory';
import { isLosingForMover, moves, type Board } from '../gameplay';
import { getSmartBotStep, randomBotStrategy, smartBotStrategy } from './bot-strategy';

describe('getSmartBotStep', () => {
  it('odd, odd, odd, odd case: split a non-1 pile', () => {
    const botStep = getSmartBotStep([1, 3, 1, 1]);
    expect(botStep.pileId).toEqual(1);
  });

  it('odd, odd, odd, even case: split the even pile into odd-odd', () => {
    const botStep = getSmartBotStep([3, 5, 4, 7]);
    expect(botStep.pileId).toEqual(2);
    expect([1, 3]).toContainEqual(botStep.pieceCount);
    // must remove a different pile, never the pile being split
    expect(botStep.removedPileId).not.toEqual(botStep.pileId);
    expect([0, 1, 2, 3]).toContain(botStep.removedPileId);
  });

  it('odd, odd, even, even case: remove one even, split the other into odd-odd', () => {
    const botStep = getSmartBotStep([4, 4, 3, 5]);
    expect([0, 1]).toContainEqual(botStep.pileId);
    expect([1, 3]).toContainEqual(botStep.pieceCount);
    // remove the other even pile (0 or 1), never the pile being split
    expect([0, 1]).toContainEqual(botStep.removedPileId);
    expect(botStep.removedPileId).not.toEqual(botStep.pileId);
  });

  it('even, even, even, even case: follow strategy for halfed piles recursively', () => {
    const botStep = getSmartBotStep([20, 28, 8, 12]);
    expect(botStep.pileId).toEqual(2);
    expect(botStep.pieceCount).toEqual(4);
  });

  describe('even, even, even, odd case', () => {
    it('2, 2, 2, 1', () => {
      const botStep = getSmartBotStep([2, 2, 2, 1]);
      expect([0, 1, 2]).toContainEqual(botStep.pileId);
      expect(botStep.pieceCount).toEqual(1);
    });

    it('2, 2, 2, 3', () => {
      const botStep = getSmartBotStep([2, 2, 2, 3]);
      expect(botStep.pileId).toEqual(3);
      // 2 and 1; which of the two halves lands in the emptied slot is arbitrary,
      // and either way the opponent is left with one pile of 1 and three of 2.
      expect(botStep.pieceCount).toEqual(2);
    });

    it('4, 4, 4, 15', () => {
      const botStep = getSmartBotStep([4, 15, 4, 4]);
      expect(botStep.pileId).toEqual(1);
      expect([3, 4, 11, 12]).toContainEqual(botStep.pieceCount);
    });

    it('4, 4, 4, 11', () => {
      const botStep = getSmartBotStep([4, 11, 4, 4]);
      expect(botStep.pileId).toEqual(1);
      expect([3, 4, 7, 8]).toContainEqual(botStep.pieceCount);
    });
  });
});

// A full-strength optimality check, end to end: from a position the mover can
// win the smart bot must win as the mover, and from one it cannot every turn
// loses, so it must win as the replier whatever the random bot throws at it.
// See AGENTS.md § Testing.
describe('pile-splitter-4 smartBotStrategy', () => {
  // [1, 2, 2, 4] is the position the bot used to give away: it left the
  // opponent [1, 2, 2, 3], still won for them, where [2, 2, 2, 2] wins.
  const startBoards: Board[] = [
    [1, 2, 2, 4], [2, 2, 2, 3], [5, 5, 5, 5], [6, 6, 6, 6], [3, 4, 5, 6],
    [5, 7, 9, 11], [12, 8, 6, 10], [9, 9, 9, 10], [24, 12, 6, 18], [11, 5, 8, 8]
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

    // Both bots shuffle among their choices, so the board has to hold for every
    // line the pair of them can produce.
    for (let i = 0; i < 10; i++) {
      expect(winnerAgainstRandom(startBoard, smartSeat)).toEqual(smartSeat);
    }
  });
});
