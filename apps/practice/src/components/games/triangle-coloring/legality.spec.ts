import { isColoringAllowed } from './triangle-coloring';

const [ALLOWED, COLORED, FORBIDDEN] = [1, 2, 3] as const;
const board = (overrides: Record<number, 1 | 2 | 3> = {}) =>
  Array.from({ length: 16 }, (_, i) => overrides[i] ?? ALLOWED);

describe('isColoringAllowed', () => {
  it('accepts a triangle that is still free', () => {
    expect(isColoringAllowed(board(), 0)).toBe(true);
    expect(isColoringAllowed(board(), 15)).toBe(true);
  });

  it('refuses a triangle someone has already coloured', () => {
    expect(isColoringAllowed(board({ 5: COLORED }), 5)).toBe(false);
  });

  it('refuses a triangle forbidden by a coloured neighbour', () => {
    // Colouring 5 forbids its side neighbours 1, 4 and 6.
    const afterColouring5 = board({ 5: COLORED, 1: FORBIDDEN, 4: FORBIDDEN, 6: FORBIDDEN });
    expect(isColoringAllowed(afterColouring5, 1)).toBe(false);
    expect(isColoringAllowed(afterColouring5, 4)).toBe(false);
    expect(isColoringAllowed(afterColouring5, 6)).toBe(false);
    // A triangle that is not a neighbour stays free.
    expect(isColoringAllowed(afterColouring5, 15)).toBe(true);
  });

  it('refuses a triangle that is not on the board', () => {
    expect(isColoringAllowed(board(), -1)).toBe(false);
    expect(isColoringAllowed(board(), 16)).toBe(false);
    expect(isColoringAllowed(board(), 1.5)).toBe(false);
  });
});
