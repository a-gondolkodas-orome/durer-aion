import { range } from 'lodash';
import {
  isWinningNumber,
  isLosingNumber,
  isWinningBoard,
  isTerminal,
  splitWinningNumber,
  getSmartBotStep,
  getRandomBotStep,
  getLosingBotStep,
  generateStartBoard,
  generateTestStartBoard,
  type Board
} from './helpers';

describe('three-piles-rebuild helpers', () => {
  describe('isWinningNumber / isLosingNumber', () => {
    it('classifies losing numbers as n % 6 in {1,2}', () => {
      [1, 2, 7, 8, 13, 14, 19, 20, 2011, 2012].forEach(n => {
        expect(isLosingNumber(n)).toBe(true);
        expect(isWinningNumber(n)).toBe(false);
      });
    });

    it('classifies winning numbers as n >= 3 with n % 6 in {0,3,4,5}', () => {
      [3, 4, 5, 6, 9, 10, 11, 12, 2010].forEach(n => {
        expect(isWinningNumber(n)).toBe(true);
        expect(isLosingNumber(n)).toBe(false);
      });
    });

    it('treats 1 and 2 as losing (cannot be kept/split)', () => {
      expect(isWinningNumber(1)).toBe(false);
      expect(isWinningNumber(2)).toBe(false);
    });

    // Cross-check the mod-6 formula against the game-theoretic recursion:
    // n is winning iff it splits into three losing numbers.
    it('agrees with the recursive definition up to 200', () => {
      const winning: boolean[] = [];
      for (let n = 0; n <= 200; n++) {
        let canWin = false;
        for (let x = 1; x <= n - 2 && !canWin; x++) {
          for (let y = 1; y <= n - 1 - x && !canWin; y++) {
            const z = n - x - y;
            if (!winning[x] && !winning[y] && !winning[z]) canWin = true;
          }
        }
        winning[n] = canWin;
        expect(canWin).toBe(isWinningNumber(n));
      }
    });
  });

  describe('isTerminal / isWinningBoard', () => {
    it('is terminal when no pile can be split', () => {
      expect(isTerminal([1, 1, 1])).toBe(true);
      expect(isTerminal([2, 1, 2])).toBe(true);
      expect(isTerminal([2, 1, 3])).toBe(false);
    });

    it('a board is winning iff some pile is a winning number', () => {
      expect(isWinningBoard([7, 8, 13])).toBe(false);
      expect(isWinningBoard([7, 8, 9])).toBe(true);
      expect(isWinningBoard([2010, 2011, 2012])).toBe(true);
    });
  });

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

  describe('generateStartBoard', () => {
    it('always returns a playable triple, and produces both winning and losing starts', () => {
      let winningStarts = 0;
      let losingStarts = 0;
      for (let i = 0; i < 300; i++) {
        const board = generateStartBoard();
        expect(board).toHaveLength(3);
        expect(isTerminal(board)).toBe(false);
        isWinningBoard(board) ? winningStarts++ : losingStarts++;
      }
      expect(winningStarts).toBeGreaterThan(0);
      expect(losingStarts).toBeGreaterThan(0);
    });

    it('generateTestStartBoard is also playable', () => {
      for (let i = 0; i < 100; i++) {
        expect(isTerminal(generateTestStartBoard())).toBe(false);
      }
    });
  });
});
