import { getGameStateAfterAiTurn } from './strategy';

describe('coin123 strategy', () => {
  describe('getGameStateAfterAiTurn', () => {
    it('should apply winning move if two piles are odd and one is even', () => {
      expect(getGameStateAfterAiTurn({ board: [3, 2, 5] }).nextBoard).toEqual([4, 2, 4]);
      expect(getGameStateAfterAiTurn({ board: [5, 1, 0] }).nextBoard).toEqual([6, 0, 0]);
    });

    it('should apply winning move if two piles are even and one is odd', () => {
      expect(getGameStateAfterAiTurn({ board: [0, 1, 0] })).toEqual(
        { nextBoard: [0, 0, 0], isGameEnd: true, winnerIndex: null }
      );
      expect(getGameStateAfterAiTurn({ board: [4, 1, 2] }).nextBoard).toEqual([4, 0, 2]);
    });

    it('should make a valid move in a not winning situation', () => {
      expect(getGameStateAfterAiTurn({ board: [0, 2, 4] }).nextBoard).toEqual([0, 1, 4]);
      expect(getGameStateAfterAiTurn({ board: [1, 5, 3] }).nextBoard).toEqual([0, 5, 3]);
    });
  });
});
