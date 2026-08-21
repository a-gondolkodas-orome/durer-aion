import { isPlacementAllowed } from './gameplay';

describe('isPlacementAllowed', () => {
  it('accepts every square of the board, however many pieces it already holds', () => {
    const board = [3, 0, 1, 0, 2];
    for (let i = 0; i < board.length; i++) expect(isPlacementAllowed(board, i)).toBe(true);
  });

  it('refuses an index past the last square', () => {
    expect(isPlacementAllowed([0, 0, 0, 0], 4)).toBe(false);
    expect(isPlacementAllowed([0, 0, 0, 0, 0], 5)).toBe(false);
  });

  it('reads the square count off the board, so the two games differ only in size', () => {
    expect(isPlacementAllowed([0, 0, 0, 0], 4)).toBe(false); // two-times-two
    expect(isPlacementAllowed([0, 0, 0, 0, 0], 4)).toBe(true); // five-squares
  });

  it('refuses a negative or non-integer index', () => {
    expect(isPlacementAllowed([0, 0, 0, 0], -1)).toBe(false);
    expect(isPlacementAllowed([0, 0, 0, 0], 1.5)).toBe(false);
    expect(isPlacementAllowed([0, 0, 0, 0], NaN)).toBe(false);
  });
});
