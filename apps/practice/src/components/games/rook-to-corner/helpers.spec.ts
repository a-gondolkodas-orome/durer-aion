import { range } from 'lodash';
import { getAllowedMoves, generateStartBoard, isTarget, boardSize, target } from './helpers';

describe('rook to corner', () => {
  describe('getAllowedMoves()', () => {
    it('allows moving right and down any number of squares only', () => {
      const moves = getAllowedMoves({ rookPosition: { row: 5, col: 5 } });
      const expected = [
        { row: 5, col: 6 }, { row: 5, col: 7 },
        { row: 6, col: 5 }, { row: 7, col: 5 }
      ];
      expect(moves).toEqual(expect.arrayContaining(expected));
      expect(moves.length).toBe(expected.length);
    });

    it('never allows moving left or up', () => {
      const moves = getAllowedMoves({ rookPosition: { row: 4, col: 4 } });
      expect(moves.every(m => m.row >= 4 && m.col >= 4)).toBe(true);
      expect(moves.some(m => m.row < 4 || m.col < 4)).toBe(false);
    });

    it('has no moves from the bottom-right target square', () => {
      expect(getAllowedMoves({ rookPosition: target }).length).toBe(0);
    });
  });

  describe('isTarget()', () => {
    it('is true only for the bottom-right square', () => {
      expect(isTarget({ row: 7, col: 7 })).toBe(true);
      expect(isTarget({ row: 7, col: 6 })).toBe(false);
      expect(isTarget({ row: 0, col: 0 })).toBe(false);
    });
  });

  describe('generateStartBoard()', () => {
    it('always starts on a valid square that is not the target', () => {
      range(200).forEach(() => {
        const { row, col } = generateStartBoard().rookPosition;
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(boardSize);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(boardSize);
        expect(isTarget({ row, col })).toBe(false);
      });
    });

    it('never starts inside the bottom-right 3x3 corner', () => {
      range(500).forEach(() => {
        const { row, col } = generateStartBoard().rookPosition;
        expect(row >= boardSize - 3 && col >= boardSize - 3).toBe(false);
      });
    });

    it('produces both diagonal (P) and off-diagonal (N) start positions', () => {
      const positions = range(200).map(() => generateStartBoard().rookPosition);
      expect(positions.some(p => p.row === p.col)).toBe(true);
      expect(positions.some(p => p.row !== p.col)).toBe(true);
    });
  });
});
