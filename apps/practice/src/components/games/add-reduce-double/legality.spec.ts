import { isTransferAllowed } from './add-reduce-double';

describe('isTransferAllowed', () => {
  const board = [6, 3];

  it('accepts an even count from two up to the whole pile', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 2 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 4 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 6 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 1, pieceCount: 2 })).toBe(true);
  });

  it('refuses an odd count — half of it could not be moved across', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 3 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 5 })).toBe(false);
  });

  it('refuses taking nothing', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 0 })).toBe(false);
  });

  it('refuses taking more than the pile holds', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 8 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: 1, pieceCount: 4 })).toBe(false);
  });

  it('refuses a pile that does not exist', () => {
    expect(isTransferAllowed(board, { pileId: 2, pieceCount: 2 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: -1, pieceCount: 2 })).toBe(false);
  });
});
