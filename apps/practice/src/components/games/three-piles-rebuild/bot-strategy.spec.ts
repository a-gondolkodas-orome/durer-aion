import { range } from 'lodash';
import {
  getLosingBotStep,
  getRandomBotStep,
  getSmartBotStep,
  splitWinningNumber
} from './bot-strategy';
import { isLosingNumber, isWinningBoard, isWinningNumber, type Board } from './gameplay';

describe('three-piles-rebuild bot', () => {
  describe('splitWinningNumber', () => {
    it('splits a winning number into three losing numbers summing to n', () => {
      range(3, 200).filter(isWinningNumber).forEach(n => {
        const parts = splitWinningNumber(n);
        expect(parts).toHaveLength(3);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(n);
        parts.forEach(p => {
          expect(p).toBeGreaterThanOrEqual(1);
          expect(isLosingNumber(p)).toBe(true);
        });
      });
    });

    it('handles the competition start pile 2010', () => {
      expect(splitWinningNumber(2010)).toEqual([2, 2, 2006]);
    });
  });

  describe('getSmartBotStep', () => {
    it('from a winning board hands the opponent an all-losing (terminal-or-losing) triple', () => {
      const boards: Board[] = [[7, 8, 9], [3, 7, 8], [6, 13, 14], [2010, 2011, 2012], [12, 1, 2]];
      boards.forEach(board => {
        const { keepId, parts } = getSmartBotStep(board);
        expect(isWinningNumber(board[keepId])).toBe(true);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(board[keepId]);
        // opponent receives a board with no winning pile → losing for them
        expect(isWinningBoard(parts)).toBe(false);
      });
    });

    it('from a losing board still returns a legal split', () => {
      const { keepId, parts } = getSmartBotStep([7, 8, 13]);
      expect([7, 8, 13][keepId]).toBeGreaterThanOrEqual(3);
      expect(parts.reduce((a, b) => a + b, 0)).toBe([7, 8, 13][keepId]);
      parts.forEach(p => expect(p).toBeGreaterThanOrEqual(1));
    });
  });

  describe('getLosingBotStep', () => {
    it('minimizes the number of winning piles handed to the opponent', () => {
      // every split of a losing pile leaves >= 1 winning pile; best is exactly 1
      const { parts } = getLosingBotStep([7, 8, 13]);
      expect(parts.filter(isWinningNumber).length).toBe(1);
    });
  });

  describe('getRandomBotStep', () => {
    it('grabs an immediate one-move win when a pile is 3..6', () => {
      [3, 4, 5, 6].forEach(n => {
        const { keepId, parts } = getRandomBotStep([1, n, 2]);
        expect([1, n, 2][keepId]).toBe(n);
        expect(Math.max(...parts)).toBeLessThan(3); // opponent gets a terminal triple
        expect(parts.reduce((a, b) => a + b, 0)).toBe(n);
      });
    });

    it('otherwise returns a legal split of a splittable pile', () => {
      for (let i = 0; i < 50; i++) {
        const board: Board = [7, 8, 13];
        const { keepId, parts } = getRandomBotStep(board);
        expect(board[keepId]).toBeGreaterThanOrEqual(3);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(board[keepId]);
        parts.forEach(p => expect(p).toBeGreaterThanOrEqual(1));
      }
    });
  });
});
