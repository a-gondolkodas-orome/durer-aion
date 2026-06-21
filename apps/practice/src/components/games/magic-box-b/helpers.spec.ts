import { isLineFull, emptyCellsInLine, placeStoneAt } from './helpers';

describe('isLineFull', () => {
  it('should be false when a row is not fully occupied', () => {
    const stones = [true, true, false, false, false, false, false, false, false];
    expect(isLineFull(stones, 0)).toBe(false);
  });

  it('should be true when a row is fully occupied', () => {
    const stones = [true, true, true, false, false, false, false, false, false];
    expect(isLineFull(stones, 0)).toBe(true);
  });

  it('should be true when a column is fully occupied', () => {
    const stones = [true, false, false, true, false, false, true, false, false];
    expect(isLineFull(stones, 3)).toBe(true);
  });
});

describe('emptyCellsInLine', () => {
  it('should return only the empty cells of the given line', () => {
    const stones = [true, false, true, false, false, false, false, false, false];
    expect(emptyCellsInLine(stones, 0)).toEqual([1]);
  });

  it('should return all three cells when the line is fully empty', () => {
    const stones = Array(9).fill(false);
    expect(emptyCellsInLine(stones, 5)).toEqual([2, 5, 8]);
  });
});

describe('placeStoneAt', () => {
  it('should set the given cell to true without mutating the input', () => {
    const stones = Array(9).fill(false);
    const next = placeStoneAt(stones, 4);
    expect(next[4]).toBe(true);
    expect(stones[4]).toBe(false);
  });
});
