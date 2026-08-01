import { isPile, isMergeAllowed } from './pile-union';

describe('isPile', () => {
  const board = [3, 2, 5];

  it('accepts every pile on the table', () => {
    expect(isPile(board, 0)).toBe(true);
    expect(isPile(board, 2)).toBe(true);
  });

  it('refuses an index off the table', () => {
    expect(isPile(board, 3)).toBe(false);
    expect(isPile(board, -1)).toBe(false);
    expect(isPile(board, 1.5)).toBe(false);
  });

  it('refuses everything once the table is empty', () => {
    expect(isPile([], 0)).toBe(false);
  });
});

describe('isMergeAllowed', () => {
  const board = [3, 2, 5];

  it('accepts two different piles, in either order', () => {
    expect(isMergeAllowed(board, [0, 1])).toBe(true);
    expect(isMergeAllowed(board, [1, 0])).toBe(true);
    expect(isMergeAllowed(board, [0, 2])).toBe(true);
  });

  it('refuses merging a pile with itself', () => {
    expect(isMergeAllowed(board, [1, 1])).toBe(false);
  });

  it('refuses a pile that is not on the table', () => {
    expect(isMergeAllowed(board, [0, 3])).toBe(false);
    expect(isMergeAllowed(board, [-1, 0])).toBe(false);
  });

  it('refuses anything that is not a pair of piles', () => {
    expect(isMergeAllowed(board, [0])).toBe(false);
    expect(isMergeAllowed(board, [0, 1, 2])).toBe(false);
  });

  it('refuses a merge on a single-pile table — there is nothing to merge with', () => {
    expect(isMergeAllowed([4], [0, 1])).toBe(false);
  });
});
