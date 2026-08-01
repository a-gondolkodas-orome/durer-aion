import { isFlipAllowed, isRemovalAllowed } from './discs-flip-or-remove';

// board[0] = blue discs, board[1] = red discs.
describe('isRemovalAllowed', () => {
  it('accepts taking one or two blue discs', () => {
    expect(isRemovalAllowed([3, 4], 1)).toBe(true);
    expect(isRemovalAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses any other count', () => {
    expect(isRemovalAllowed([3, 4], 0)).toBe(false);
    expect(isRemovalAllowed([3, 4], 3)).toBe(false);
    expect(isRemovalAllowed([3, 4], -1)).toBe(false);
  });

  it('refuses taking more blue discs than there are', () => {
    expect(isRemovalAllowed([1, 4], 2)).toBe(false);
    expect(isRemovalAllowed([1, 4], 1)).toBe(true);
    expect(isRemovalAllowed([0, 4], 1)).toBe(false);
  });
});

describe('isFlipAllowed', () => {
  it('accepts flipping one or two red discs', () => {
    expect(isFlipAllowed([3, 4], 1)).toBe(true);
    expect(isFlipAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses flipping more red discs than there are', () => {
    expect(isFlipAllowed([3, 1], 2)).toBe(false);
    expect(isFlipAllowed([3, 1], 1)).toBe(true);
    expect(isFlipAllowed([3, 0], 1)).toBe(false);
  });

  it('counts each pile separately — a full blue pile does not license a red flip', () => {
    expect(isFlipAllowed([9, 0], 1)).toBe(false);
    expect(isRemovalAllowed([0, 9], 1)).toBe(false);
  });
});
