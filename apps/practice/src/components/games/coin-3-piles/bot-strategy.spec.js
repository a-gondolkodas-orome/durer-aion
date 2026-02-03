import { botMoveParams } from './bot-strategy';
import { _ } from 'lodash';

describe('coin123 strategy', () => {
  describe('aiBotStrategy (tested via botMoveParams)', () => {
    it('should apply winning move if two piles are odd and one is even: v1', () => {
      const board = [3, 2, 5];
      expect(botMoveParams({ board })).toEqual({ remove: 3, add: 1 });
    });

    it('should apply winning move if two piles are odd and one is even: v2', () => {
      const board = [5, 1, 0];
      expect(botMoveParams({ board })).toEqual({ remove: 2, add: 1 });
    });

    it('should apply winning move if two piles are even and one is odd: v1', () => {
      const board = [0, 1, 0];
      expect(botMoveParams({ board })).toEqual({ remove: 2, add: null });
    });

    it('should apply winning move if two piles are even and one is odd: v2', () => {
      const board = [4, 1, 2];
      expect(botMoveParams({ board })).toEqual({ remove: 2, add: null });
    });

    it('should make a valid move in a not winning situation: v1', () => {
      const board = [0, 2, 4];
      expect(botMoveParams({ board })).toEqual({ remove: 2, add: null });
    });

    it('should make a valid move in a not winning situation: v2', () => {
      const board = [1, 5, 3];
      expect(botMoveParams({ board })).toEqual({ remove: 1 });
    });
  });
});
