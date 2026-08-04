import { getRectangles } from '../gameplay';
import { boardGrundy } from '../bot-strategy';
import { generateStartBoard } from './gameplay';

describe('generateStartBoard', () => {
  it('places several isolated rectangles', () => {
    for (let i = 0; i < 50; i++) {
      const { grid } = generateStartBoard();
      const rects = getRectangles(grid);
      expect(rects.length).toBeGreaterThanOrEqual(2);
      // every rectangle is solidly filled (flood-fill bounding box == disc count)
      for (const r of rects) {
        for (let row = r.minR; row <= r.maxR; row++) {
          for (let col = r.minC; col <= r.maxC; col++) {
            expect(grid[row][col]).toBe(true);
          }
        }
      }
    }
  });

  it('keeps the board within a mobile-friendly width', () => {
    for (let i = 0; i < 50; i++) {
      const { grid } = generateStartBoard();
      expect(grid[0].length).toBeLessThanOrEqual(11);
    }
  });

  it('is roughly balanced between first- and second-player wins', () => {
    // boardGrundy === 0 means the player to move (the first player) loses.
    let secondPlayerWins = 0;
    const runs = 400;
    for (let i = 0; i < runs; i++) {
      if (boardGrundy(generateStartBoard().grid) === 0) secondPlayerWins++;
    }
    expect(secondPlayerWins).toBeGreaterThan(runs * 0.3);
    expect(secondPlayerWins).toBeLessThan(runs * 0.7);
  });
});
