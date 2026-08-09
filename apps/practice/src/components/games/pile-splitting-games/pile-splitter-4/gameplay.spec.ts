import { generateStartBoard, generateTestStartBoard } from './gameplay';

// Both generators draw four piles from their own range, then either keep the
// board, double it, or double it and take one piece off — so the widest pile a
// range of `min..max` can produce is `2 * max`, and the smallest is `min`.
const DRAWS = 200;

describe('pile-splitter-4 start boards', () => {
  it('draws the full boards from 5..12', () => {
    const piles = Array.from({ length: DRAWS }, generateStartBoard).flat();

    expect(Math.min(...piles)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...piles)).toBeLessThanOrEqual(24);
  });

  // The retry used to drop the range and fall back to the full-size defaults,
  // which is roughly half of all draws.
  it('keeps the test boards inside their own smaller range, retries included', () => {
    const piles = Array.from({ length: DRAWS }, generateTestStartBoard).flat();

    expect(Math.min(...piles)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...piles)).toBeLessThanOrEqual(12);
  });

  it('always draws four piles', () => {
    expect(generateStartBoard()).toHaveLength(4);
    expect(generateTestStartBoard()).toHaveLength(4);
  });
});
