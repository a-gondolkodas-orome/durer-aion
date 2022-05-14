'use strict';

import { generateNewBoard, getBoardAfterKillingGroup } from './strategy';
import { uniq, flatten } from 'lodash-es';

describe('HunyadiAndTheJanissaries strategy', () => {
  describe('generateNewBoard', () => {
    it('should generate a board of 5 possibly empty soldier groups', () => {
      const board = generateNewBoard();
      expect(board).toHaveLength(5);
      expect(uniq(flatten(board))).toEqual(['blue']);
    });
  });

  describe('getBoardAfterKillingGroup', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      expect(getBoardAfterKillingGroup([[], ['red', 'red']], 'red')).toEqual({
        board: [[], []],
        isGameEnd: true,
        hasFirstPlayerWon: false
      });
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      expect(getBoardAfterKillingGroup([['red', 'blue'], ['blue']], 'red')).toEqual({
        board: [['blue'], []],
        isGameEnd: true,
        hasFirstPlayerWon: true
      });
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const board = [['red'], ['blue', 'red'], [], ['blue', 'blue']];
      expect(getBoardAfterKillingGroup(board, 'red')).toEqual({
        board: [['blue'], [], ['blue', 'blue'], []],
        isGameEnd: false
      });
    });
  });
});
