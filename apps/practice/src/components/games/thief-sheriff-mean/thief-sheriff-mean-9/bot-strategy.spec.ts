import { getBotCard, getBotScore } from './bot-strategy';
import { Sheriff, Thief, generateStartBoard, type Board } from '../helpers';

describe('thief-sheriff-mean-9 smart bot', () => {
  describe('as Sheriff', () => {
    it('wins from the starting position', () => {
      expect(getBotScore(generateStartBoard(), Sheriff)).toBe(1);
    });

    it('picks 5 as the unique winning opening move', () => {
      expect(getBotCard(generateStartBoard(), Sheriff)).toBe(5);
    });

    it('picks 4 when Thief took a card from {1,2,3,6}', () => {
      const board: Board = { cards: [[5], [3]], numTurns: 2 };
      expect(getBotCard(board, Sheriff)).toBe(4);
    });

    it('picks 6 when Thief took a card from {4,7,8,9}', () => {
      // Mirror of the previous case: solution is symmetric around 5 (replace x with 9-x)
      const board: Board = { cards: [[5], [7]], numTurns: 2 };
      expect(getBotCard(board, Sheriff)).toBe(6);
    });
  });

  describe('as Thief', () => {
    it('wins when Sheriff opens with any card other than 5', () => {
      expect(getBotScore({ cards: [[1], []], numTurns: 1 }, Thief)).toBe(1);
      expect(getBotScore({ cards: [[3], []], numTurns: 1 }, Thief)).toBe(1);
      expect(getBotScore({ cards: [[6], []], numTurns: 1 }, Thief)).toBe(1);
      expect(getBotScore({ cards: [[8], []], numTurns: 1 }, Thief)).toBe(1);
    });
  });
});
