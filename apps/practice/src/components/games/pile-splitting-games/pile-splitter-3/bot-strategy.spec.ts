import { getAiStep } from "./bot-strategy";

describe('getAiStep', () => {
  it('odd, odd, odd case: split a non-1 pile', () => {
    const aiStep = getAiStep([1, 3, 1]);
    expect(aiStep.pileId).toEqual(1);
  });

  it('odd, odd, even case: split the even pile into odd-odd', () => {
    const aiStep = getAiStep([3, 5, 4]);
    expect(aiStep.pileId).toEqual(2);
    expect(aiStep.pieceCount === 1 || aiStep.pieceCount === 3);
  });

  it('odd, even, even case: remove one even, split the other into odd-odd', () => {
    const aiStep = getAiStep([4, 4, 3]);
    expect(aiStep.pileId === 0 || aiStep.pileId === 1);
    expect(aiStep.pieceCount === 1 || aiStep.pieceCount === 3)
  });

  it('even, even, even case: follow strategy for halfed piles', () => {
    const aiStep = getAiStep([10, 14, 4]);
    expect(aiStep.pileId).toEqual(2);
    expect(aiStep.pieceCount).toEqual(2);
  });
});
