import { isSpreadAllowed, type Board } from './four-piles-spread-ahead';

const board: Board = [2, 3, 4, 5];

describe('isSpreadAllowed', () => {
  it('allows spreading onto every pile in front of the chosen one', () => {
    expect([1, 2, 3].every(pieceCount => isSpreadAllowed(board, 3, pieceCount))).toBe(true);
  });

  it('rejects spreading further forward than the first pile', () => {
    expect(isSpreadAllowed(board, 3, 4)).toBe(false);
    expect(isSpreadAllowed(board, 1, 2)).toBe(false);
  });

  it('rejects any move from the first pile, which has nothing in front of it', () => {
    expect(isSpreadAllowed(board, 0, 1)).toBe(false);
  });

  it('rejects taking more pieces than the pile holds', () => {
    expect(isSpreadAllowed([2, 3, 1, 5], 2, 2)).toBe(false);
    expect(isSpreadAllowed([2, 3, 1, 5], 2, 1)).toBe(true);
  });

  it('rejects taking nothing', () => {
    expect(isSpreadAllowed(board, 3, 0)).toBe(false);
  });

  it('rejects a pile id outside the board or a non-integer count', () => {
    expect(isSpreadAllowed(board, 4, 1)).toBe(false);
    expect(isSpreadAllowed(board, 3, 1.5)).toBe(false);
  });
});
