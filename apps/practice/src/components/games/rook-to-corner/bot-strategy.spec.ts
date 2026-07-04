import { range } from 'lodash';
import { getOptimalSmartBotMove, getRandomBotMove } from './bot-strategy';
import { getAllowedMoves, isTarget, boardSize, type Field } from './helpers';

const isAllowed = (from: Field, to: Field) =>
  getAllowedMoves({ rookPosition: from }).some(m => m.row === to.row && m.col === to.col);

describe('rook to corner', () => {
  describe('getOptimalSmartBotMove()', () => {
    it('moves down onto the diagonal from an off-diagonal position with row < col', () => {
      expect(getOptimalSmartBotMove({ rookPosition: { row: 2, col: 5 } })).toEqual({ row: 5, col: 5 });
    });

    it('moves right onto the diagonal from an off-diagonal position with row > col', () => {
      expect(getOptimalSmartBotMove({ rookPosition: { row: 6, col: 1 } })).toEqual({ row: 6, col: 6 });
    });

    it('wins immediately by reaching the bottom-right corner when possible', () => {
      expect(getOptimalSmartBotMove({ rookPosition: { row: 7, col: 2 } })).toEqual({ row: 7, col: 7 });
      expect(getOptimalSmartBotMove({ rookPosition: { row: 3, col: 7 } })).toEqual({ row: 7, col: 7 });
    });

    it('from any non-diagonal position plays a legal move onto the diagonal', () => {
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          if (row === col) continue;
          const from = { row, col };
          const move = getOptimalSmartBotMove({ rookPosition: from });
          expect(move.row).toBe(move.col); // landed on the diagonal (a P-position)
          expect(isAllowed(from, move)).toBe(true);
        }
      }
    });

    it('from a diagonal (losing) position still plays a legal move', () => {
      const from = { row: 3, col: 3 };
      const move = getOptimalSmartBotMove({ rookPosition: from });
      expect(isAllowed(from, move)).toBe(true);
    });
  });

  describe('getRandomBotMove()', () => {
    it('takes an immediate win when the target is reachable', () => {
      expect(isTarget(getRandomBotMove({ rookPosition: { row: 7, col: 3 } }))).toBe(true);
      expect(isTarget(getRandomBotMove({ rookPosition: { row: 1, col: 7 } }))).toBe(true);
    });

    it('otherwise plays a legal move', () => {
      const from = { row: 2, col: 3 };
      range(30).forEach(() => {
        expect(isAllowed(from, getRandomBotMove({ rookPosition: from }))).toBe(true);
      });
    });
  });
});
