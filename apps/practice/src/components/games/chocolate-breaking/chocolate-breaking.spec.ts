import {
  grundy, totalGrundy, hasSafeBreak, applyBreak, isFlexible,
  generateStartBoard, type Board, type Move
} from './helpers';
import { getSmartBotMove, getRandomBotMove } from './bot-strategy';

const single = (w: number, h: number): Board => ({ pieces: [{ id: 0, w, h }], nextId: 1 });

// Play a full game between two move pickers. The player who faces a position
// with no safe break (is forced to break off a 1×1) loses.
const playGame = (start: Board, pickers: [(b: Board) => Move, (b: Board) => Move]): number => {
  let board = start;
  let current = 0;
  while (hasSafeBreak(board.pieces)) {
    board = applyBreak(board, pickers[current](board));
    current = 1 - current;
  }
  return 1 - current;
};

describe('chocolate breaking', () => {
  describe('grundy()', () => {
    it('gives 0 to strips that cannot be broken safely', () => {
      expect(grundy(1, 1)).toBe(0);
      expect(grundy(1, 2)).toBe(0);
      expect(grundy(1, 3)).toBe(0);
    });

    it('matches known Sprague–Grundy values', () => {
      expect(grundy(1, 4)).toBe(1);
      expect(grundy(2, 2)).toBe(1);
      expect(grundy(3, 3)).toBe(0);
      // the original competition board: first player wins
      expect(grundy(5, 10)).toBe(2);
    });
  });

  describe('isFlexible()', () => {
    it('identifies pieces that still have a safe break', () => {
      expect(isFlexible({ w: 1, h: 1 })).toBe(false);
      expect(isFlexible({ w: 1, h: 3 })).toBe(false);
      expect(isFlexible({ w: 1, h: 4 })).toBe(true);
      expect(isFlexible({ w: 2, h: 2 })).toBe(true);
    });
  });

  describe('smart bot', () => {
    it('always converts a winning position against random play', () => {
      let tested = 0;
      for (let w = 3; w <= 5; w++) {
        for (let h = 4; h <= 7; h++) {
          if (totalGrundy([{ id: 0, w, h }]) === 0) continue; // first player loses here
          tested++;
          for (let trial = 0; trial < 40; trial++) {
            expect(playGame(single(w, h), [getSmartBotMove, getRandomBotMove])).toBe(0);
          }
        }
      }
      expect(tested).toBeGreaterThan(0);
    });

    it('wins as the second player when the position is second-player-winning', () => {
      let tested = 0;
      for (let w = 3; w <= 5; w++) {
        for (let h = 4; h <= 7; h++) {
          if (totalGrundy([{ id: 0, w, h }]) !== 0) continue; // first player wins here
          tested++;
          for (let trial = 0; trial < 40; trial++) {
            expect(playGame(single(w, h), [getRandomBotMove, getSmartBotMove])).toBe(1);
          }
        }
      }
      expect(tested).toBeGreaterThan(0);
    });
  });

  describe('generateStartBoard()', () => {
    it('produces a single breakable rectangle', () => {
      for (let i = 0; i < 50; i++) {
        const board = generateStartBoard();
        expect(board.pieces).toHaveLength(1);
        expect(hasSafeBreak(board.pieces)).toBe(true);
      }
    });
  });
});
