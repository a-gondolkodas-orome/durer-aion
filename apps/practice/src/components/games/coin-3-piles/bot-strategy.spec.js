import { aiBotStrategy } from './bot-strategy';
import { _ } from 'lodash';

describe('coin123 strategy', () => {
  describe('aiBotStrategy', () => {
    it('should apply winning move if two piles are odd and one is even: v1', () => {
      const board = [3, 2, 5];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(3);
      setTimeout(() => {
        expect(coinToAdd).toEqual(1);
      }, 0)
    });

    it('should apply winning move if two piles are odd and one is even: v2', () => {
      const board = [5, 1, 0];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(2);
      setTimeout(() => {
        expect(coinToAdd).toEqual(1);
      }, 0)
    });

    it('should apply winning move if two piles are even and one is odd: v1', () => {
      const board = [0, 1, 0];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(2);
      setTimeout(() => {
        expect(coinToAdd).toEqual(null);
      }, 0)
    });

    it('should apply winning move if two piles are even and one is odd: v2', () => {
      const board = [4, 1, 2];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(2);
      setTimeout(() => {
        expect(coinToAdd).toEqual(null);
      }, 0)
    });

    it('should make a valid move in a not winning situation: v1', () => {
      const board = [0, 2, 4];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(2);
      setTimeout(() => {
        expect(coinToAdd).toEqual(null);
      }, 0)
    });

    it('should make a valid move in a not winning situation: v2', () => {
      const board = [1, 5, 3];
      let coinToRemove = null;
      let coinToAdd = null;
      const moves = {
        removeCoin: (board, v) => {coinToRemove = v; return { nextBoard: board }},
        addCoin: (_, v) => {coinToAdd = v;}
      }
      aiBotStrategy({ board, moves });
      expect(coinToRemove).toEqual(1);
      setTimeout(() => {
        expect(coinToAdd).toEqual(null);
      }, 0)
    });
  });
});
