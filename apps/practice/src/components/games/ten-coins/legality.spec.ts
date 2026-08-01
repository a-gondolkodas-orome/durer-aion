import { isConversionAllowed } from './ten-coins';

describe('isConversionAllowed', () => {
  // Four 3s and six 1s: the values 1 and 3 are on the table, 2 and 4 are not.
  const board = [1, 1, 1, 1, 1, 1, 3, 3, 3, 3];

  it('accepts a value on the table turned into any smaller one', () => {
    expect(isConversionAllowed(board, 3, 1)).toBe(true);
    expect(isConversionAllowed(board, 3, 2)).toBe(true);
  });

  it('refuses a value that is not on the table', () => {
    expect(isConversionAllowed(board, 2, 1)).toBe(false);
    expect(isConversionAllowed(board, 4, 1)).toBe(false);
  });

  it('refuses a target that is not strictly smaller', () => {
    expect(isConversionAllowed(board, 3, 3)).toBe(false);
    expect(isConversionAllowed(board, 3, 4)).toBe(false);
  });

  it('refuses value-1 coins, which have no smaller value to become', () => {
    expect(isConversionAllowed(board, 1, 1)).toBe(false);
    expect(isConversionAllowed(board, 1, 0)).toBe(false);
  });

  it('refuses non-integer or non-positive arguments', () => {
    expect(isConversionAllowed(board, 3, 0)).toBe(false);
    expect(isConversionAllowed(board, 3, -1)).toBe(false);
    expect(isConversionAllowed(board, 3, 1.5)).toBe(false);
  });
});
