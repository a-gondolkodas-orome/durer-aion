import { hasFullLine, generateEmptyBoard } from './helpers';

describe('hasFullLine', () => {
  it('should be false for an empty board', () => {
    expect(hasFullLine(generateEmptyBoard())).toBe(false);
  });

  it('should be true if a row is fully occupied', () => {
    const board = [
      true, true, true,
      false, false, false,
      false, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be true if a column is fully occupied', () => {
    const board = [
      true, false, false,
      true, false, false,
      true, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be false for the maximal 6-stone configuration with no full line', () => {
    // diagonal cells [0, 4, 8] left empty, the other six filled
    const board = [
      false, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(false);
  });

  it('should be true once a 7th stone is added to the maximal configuration', () => {
    const board = [
      true, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });
});
