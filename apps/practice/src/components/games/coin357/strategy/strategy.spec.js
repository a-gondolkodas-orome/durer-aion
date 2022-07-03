import { generateNewBoard, getGameStateAfterAiMove } from './strategy';

describe('coin357 strategy', () => {
  describe('generateNewBoard', () => {
    it('should return [3, 5, 7]', () => {
      expect(generateNewBoard()).toEqual([3, 5, 7]);
    });
  });

  describe('getGameStateAfterAiMove', () => {
    it('should apply winning move if two heaps are odd and one is even', () => {
      expect(getGameStateAfterAiMove([3, 2, 5]).board).toEqual([4, 2, 4]);
      expect(getGameStateAfterAiMove([5, 1, 0]).board).toEqual([6, 0, 0]);
    });

    it('should apply winning move if two heaps are even and one is odd', () => {
      expect(getGameStateAfterAiMove([0, 1, 0])).toEqual({ board: [0, 0, 0], isGameEnd: true });
      expect(getGameStateAfterAiMove([4, 1, 2]).board).toEqual([4, 0, 2]);
    });

    it('should make a valid move in a not winning situation', () => {
      expect(getGameStateAfterAiMove([0, 2, 4]).board).toEqual([0, 1, 4]);
      expect(getGameStateAfterAiMove([1, 5, 3]).board).toEqual([0, 5, 3]);
    });
  });
});
