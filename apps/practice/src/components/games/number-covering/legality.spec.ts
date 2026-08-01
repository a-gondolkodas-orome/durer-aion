import { isCoveringAllowed, COVERED } from './number-covering';

const board = [1, 2, COVERED, 4, 5];

describe('isCoveringAllowed', () => {
  it('allows covering a number still showing', () => {
    expect([1, 2, 4, 5].every(number => isCoveringAllowed(board, number))).toBe(true);
  });

  it('rejects a number already covered', () => {
    expect(isCoveringAllowed(board, 3)).toBe(false);
  });

  it('rejects a number not on the table', () => {
    expect(isCoveringAllowed(board, 6)).toBe(false);
    expect(isCoveringAllowed(board, 0)).toBe(false);
    expect(isCoveringAllowed(board, 2.5)).toBe(false);
  });
});
