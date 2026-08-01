import { isStepAllowed, type Board } from './superstitious-counting';

const boardWith = (restricted: number | null): Board => ({ current: 10, target: 50, restricted });

describe('isStepAllowed', () => {
  it('allows any step from 1 to 12 when nothing is forbidden', () => {
    const board = boardWith(null);
    expect([1, 6, 12].every(step => isStepAllowed(board, step))).toBe(true);
  });

  it('rejects the step forbidden by superstition', () => {
    // the other player added 8, so 13 − 8 = 5 is forbidden
    expect(isStepAllowed(boardWith(5), 5)).toBe(false);
    expect(isStepAllowed(boardWith(5), 4)).toBe(true);
  });

  it('rejects standing still or stepping backwards', () => {
    const board = boardWith(null);
    expect(isStepAllowed(board, 0)).toBe(false);
    expect(isStepAllowed(board, -3)).toBe(false);
  });

  it('rejects a step of 13 or more', () => {
    const board = boardWith(null);
    expect(isStepAllowed(board, 13)).toBe(false);
    expect(isStepAllowed(board, 20)).toBe(false);
  });

  it('rejects a non-integer step', () => {
    expect(isStepAllowed(boardWith(null), 2.5)).toBe(false);
  });
});
