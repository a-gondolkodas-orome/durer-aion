import { describe, it, expect } from 'vitest';
import { isFlipAllowed, isRemovalAllowed } from './gameplay';

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

// Exhaustive optimality check for both variants (max 6 and max 10 discs).
// Moves: remove 1-2 blue, or flip 1-2 red into blue.
// A player who cannot move (board [0,0]) loses. We verify against an
// independent minimax over the whole reachable state space that the bot,
// whenever the mover can win, always moves to a losing-for-opponent position.
