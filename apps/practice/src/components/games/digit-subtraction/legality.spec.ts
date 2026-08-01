import { isSubtractableDigit } from './digit-subtraction';

describe('isSubtractableDigit', () => {
  it('accepts a digit that appears in the current number', () => {
    expect(isSubtractableDigit(147, 1)).toBe(true);
    expect(isSubtractableDigit(147, 4)).toBe(true);
    expect(isSubtractableDigit(147, 7)).toBe(true);
  });

  it('refuses a digit the number does not contain', () => {
    expect(isSubtractableDigit(147, 2)).toBe(false);
    expect(isSubtractableDigit(147, 9)).toBe(false);
  });

  it('refuses zero — subtracting it would never end the game', () => {
    expect(isSubtractableDigit(105, 0)).toBe(false);
  });

  it('refuses anything that is not a single digit', () => {
    expect(isSubtractableDigit(147, 14)).toBe(false);
    expect(isSubtractableDigit(147, -1)).toBe(false);
    expect(isSubtractableDigit(147, 1.5)).toBe(false);
  });

  it('counts a repeated digit once, and accepts it', () => {
    expect(isSubtractableDigit(11, 1)).toBe(true);
  });
});
