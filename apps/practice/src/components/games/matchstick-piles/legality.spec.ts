import { isRemovalAllowed, isSplitAllowed, type Board } from './matchstick-piles';

const board: Board = [1, 3, 5];

describe('isRemovalAllowed', () => {
  it('allows taking a match from any pile', () => {
    expect([0, 1, 2].every(pileId => isRemovalAllowed(board, pileId))).toBe(true);
  });

  it('rejects a pile id outside the board', () => {
    expect(isRemovalAllowed(board, 3)).toBe(false);
    expect(isRemovalAllowed(board, -1)).toBe(false);
    expect(isRemovalAllowed(board, 1.5)).toBe(false);
  });
});

describe('isSplitAllowed', () => {
  it('allows any split leaving both halves non-empty', () => {
    expect([1, 2].every(firstPart => isSplitAllowed(board, 1, firstPart))).toBe(true);
  });

  it('rejects a split that would leave a half empty', () => {
    expect(isSplitAllowed(board, 1, 0)).toBe(false);
    expect(isSplitAllowed(board, 1, 3)).toBe(false);
  });

  it('rejects splitting a single-match pile', () => {
    expect(isSplitAllowed(board, 0, 1)).toBe(false);
  });

  it('rejects a non-integer split point or pile id', () => {
    expect(isSplitAllowed(board, 1, 1.5)).toBe(false);
    expect(isSplitAllowed(board, 3, 1)).toBe(false);
  });
});
