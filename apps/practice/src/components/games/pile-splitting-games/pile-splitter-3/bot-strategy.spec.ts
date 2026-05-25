import { getSmartBotStep } from "./bot-strategy";

describe('getSmartBotStep', () => {
  it('odd, odd, odd case: split a non-1 pile', () => {
    const botStep = getSmartBotStep([1, 3, 1]);
    expect(botStep.pileId).toEqual(1);
  });

  it('odd, odd, even case: split the even pile into odd-odd', () => {
    const botStep = getSmartBotStep([3, 5, 4]);
    expect(botStep.pileId).toEqual(2);
    expect(botStep.pieceCount === 1 || botStep.pieceCount === 3);
  });

  it('odd, even, even case: remove one even, split the other into odd-odd', () => {
    const botStep = getSmartBotStep([4, 4, 3]);
    expect(botStep.pileId === 0 || botStep.pileId === 1);
    expect(botStep.pieceCount === 1 || botStep.pieceCount === 3)
  });

  it('even, even, even case: follow strategy for halfed piles', () => {
    const botStep = getSmartBotStep([10, 14, 4]);
    expect(botStep.pileId).toEqual(2);
    expect(botStep.pieceCount).toEqual(2);
  });
});
