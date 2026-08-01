import { isValidStep } from './twelve-squares';

describe('isValidStep', () => {
  it('accepts a step of one or two squares', () => {
    const board = { left: 1, right: 12 };
    expect(isValidStep(board, 1)).toBe(true);
    expect(isValidStep(board, 2)).toBe(true);
  });

  it('refuses any other step size', () => {
    const board = { left: 1, right: 12 };
    expect(isValidStep(board, 0)).toBe(false);
    expect(isValidStep(board, 3)).toBe(false);
    expect(isValidStep(board, -1)).toBe(false);
  });

  it('refuses the step that would land exactly on the other piece', () => {
    // One square apart: stepping one lands on the opponent, stepping two jumps
    // over them and wins.
    expect(isValidStep({ left: 5, right: 6 }, 1)).toBe(false);
    expect(isValidStep({ left: 5, right: 6 }, 2)).toBe(true);

    // Two squares apart: the roles are reversed.
    expect(isValidStep({ left: 5, right: 7 }, 2)).toBe(false);
    expect(isValidStep({ left: 5, right: 7 }, 1)).toBe(true);
  });

  it('leaves both steps open once the pieces are three or more apart', () => {
    expect(isValidStep({ left: 4, right: 7 }, 1)).toBe(true);
    expect(isValidStep({ left: 4, right: 7 }, 2)).toBe(true);
  });
});
