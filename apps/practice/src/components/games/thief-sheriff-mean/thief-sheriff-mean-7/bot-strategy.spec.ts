import { getBotCard, getBotScore } from './bot-strategy';
import { Sheriff, Thief, generateStartBoard, type Board } from '../helpers';

describe('thief-sheriff-mean-7 smart bot', () => {
  describe('as Sheriff', () => {
    it('wins from the starting position', () => {
      expect(getBotScore(generateStartBoard(), Sheriff)).toBe(1);
    });

    it('picks 4 when holding [5] and Thief holds [2] — the unique winning second move', () => {
      // After Sheriff=5, Thief=2: only card 4 prevents Thief completing {1,2,3}
      const board: Board = { cards: [[5], [2]], numTurns: 2 };
      expect(getBotCard(board, Sheriff)).toBe(4);
    });

    it('picks 3 to deny the last path when Thief holds [2,1]', () => {
      // Thief only needs card 3 to complete {1,2,3}; 1 and 3 are the only remaining threats
      const board: Board = { cards: [[5, 4], [2, 1]], numTurns: 4 };
      expect(getBotCard(board, Sheriff)).toBe(3);
    });

    it('picks 1 to deny the last path when Thief holds [2,3]', () => {
      const board: Board = { cards: [[5, 4], [2, 3]], numTurns: 4 };
      expect(getBotCard(board, Sheriff)).toBe(1);
    });

    it('cannot prevent loss when Thief has inescapable winning combinations', () => {
      // Thief has {4,6}: Sheriff must surrender 2 of {2,5,7} to Thief,
      // and every combination ({2,5},{2,7},{5,7}) contains a winning triple
      const board: Board = { cards: [[1, 3], [4, 6]], numTurns: 4 };
      expect(getBotScore(board, Sheriff)).toBe(-1);
    });
  });

  describe('as Thief', () => {
    it('wins when Sheriff opened with 1 instead of 5', () => {
      const board: Board = { cards: [[1], []], numTurns: 1 };
      expect(getBotScore(board, Thief)).toBe(1);
    });
  });
});
