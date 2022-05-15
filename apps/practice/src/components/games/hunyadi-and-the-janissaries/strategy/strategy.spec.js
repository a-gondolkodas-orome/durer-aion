'use strict';

import { generateNewBoard, getBoardAfterKillingGroup, makeAiMove } from './strategy';
import { uniq, flatten } from 'lodash-es';
import * as random from 'lodash-es/random';

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

  describe('makeAiMove', () => {
    describe('when player is the first player', () => {
      it('should kill the group of the first soldier if there is any in the first row', () => {
        expect(makeAiMove([['blue', 'red', 'red'], ['red']], true)).toEqual({
          board: [['red'], []],
          isGameEnd: true,
          hasFirstPlayerWon: true
        });
      });

      it('should kill the group with the bigger combined weight', () => {
        expect(makeAiMove([[], ['red'], ['blue', 'blue'], ['blue']], true)).toEqual({
          board: [['red'], [], [], []],
          isGameEnd: false
        });
      });
    });

    describe('when player is the second player', () => {
      it('should split first row evenly if there are more soldiers', () => {
        expect(makeAiMove([['blue', 'blue']], false)).toEqual({
          board: [expect.toIncludeSameMembers(['blue', 'red'])],
          isGameEnd: false
        });
      });

      it('should balance soldiers with smaller weight for later rows - v1', () => {
        jest.spyOn(random, 'default').mockImplementationOnce(() => 1);
        const board = [
          ['blue'],
          ['blue'],
          [],
          ['blue', 'blue', 'blue', 'blue']
        ];
        expect(makeAiMove(board, false)).toEqual({
          board: [['blue'], ['red'], [], ['red', 'red', 'red', 'red']],
          isGameEnd: false
        });
      });

      it('should balance soldiers with smaller weight for later rows - v2', () => {
        jest.spyOn(random, 'default').mockImplementationOnce(() => 1);
        const board = [
          ['blue'],
          ['blue', 'blue', 'blue'],
          ['blue'],
          ['blue', 'blue']
        ];
        expect(makeAiMove(board, false)).toEqual({
          board: [['blue'], ['red', 'red', 'blue'], ['red'], ['red', 'red']],
          isGameEnd: false
        });
      });
    });
  });
});
