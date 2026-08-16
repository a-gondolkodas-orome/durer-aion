import { generateStartBoard } from './gameplay';

describe('generateStartBoard', () => {
  it('always produces a full rectangular grid with sides in 2..6', () => {
    for (let i = 0; i < 50; i++) {
      const { grid } = generateStartBoard();
      expect(grid.length).toBeGreaterThanOrEqual(2);
      expect(grid.length).toBeLessThanOrEqual(6);
      expect(grid[0].length).toBeGreaterThanOrEqual(2);
      expect(grid[0].length).toBeLessThanOrEqual(6);
      expect(grid.every(row => row.every(Boolean))).toBe(true);
    }
  });
});
