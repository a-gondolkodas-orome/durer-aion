import { isDigitChoiceAllowed } from './ten-digit-number';

const board = (digitCount: number) => ({
  digits: Array.from({ length: digitCount }, () => 1),
  sumMod9: digitCount % 9
});

describe('isDigitChoiceAllowed', () => {
  it('accepts each of the six offered digits', () => {
    for (const d of [1, 2, 3, 4, 5, 6]) expect(isDigitChoiceAllowed(board(0), d)).toBe(true);
  });

  it('refuses a digit outside the offered six', () => {
    expect(isDigitChoiceAllowed(board(0), 0)).toBe(false);
    expect(isDigitChoiceAllowed(board(0), 7)).toBe(false);
    expect(isDigitChoiceAllowed(board(0), 9)).toBe(false);
    expect(isDigitChoiceAllowed(board(0), -1)).toBe(false);
  });

  it('accepts a digit up to the last free slot', () => {
    expect(isDigitChoiceAllowed(board(9), 3)).toBe(true);
  });

  it('refuses any digit once all ten are written', () => {
    expect(isDigitChoiceAllowed(board(10), 3)).toBe(false);
  });
});
