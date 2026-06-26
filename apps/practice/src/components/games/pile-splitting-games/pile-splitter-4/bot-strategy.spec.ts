import { getSmartBotStep } from "./bot-strategy";

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
      expect(botStep.pieceCount).toEqual(1);
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
