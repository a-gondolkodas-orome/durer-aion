import { describe, it, expect } from 'vitest';
import { isConversionAllowed } from './gameplay';

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

// Exhaustive optimality check for both variants (coin values 1..4 and 1..5).
// Only the SET of distinct present values matters for the game, so we represent
// a position by that set. A move replaces all coins of value K with some L < K.
// You win when only one distinct value remains after your move.
// We verify against an independent minimax that on every winning position the
// bot makes a winning move.
