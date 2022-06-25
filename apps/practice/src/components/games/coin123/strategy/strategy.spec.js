import { generateNewBoard, getGameStateAfterAiMove } from './strategy';
import * as random from 'lodash-es/random';

describe('coin123 strategy', () => {
  describe('generateNewBoard', () => {
    it('should generate a new board with 3 random nonnegative integers', () => {
      jest.spyOn(random, 'default')
        .mockImplementationOnce(() => 4)
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 6);
      expect(generateNewBoard()).toEqual([4, 0, 6]);
    });

    it('should generate a non empty board', () => {
      jest.spyOn(random, 'default')
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 0);
      expect(generateNewBoard()).not.toEqual([0, 0, 0]);
    });

    it('should generate a board with at least one coin bigger than 1', () => {
      jest.spyOn(random, 'default')
        .mockImplementationOnce(() => 5)
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 0);
      expect(generateNewBoard()).not.toEqual([5, 0, 0]);
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
