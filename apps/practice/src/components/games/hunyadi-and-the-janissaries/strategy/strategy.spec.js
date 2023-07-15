'use strict';

import { generateNewBoard, getGameStateAfterKillingGroup, getGameStateAfterAiTurn } from './strategy';
import { uniq, flatten, isEqual } from 'lodash';

describe('HunyadiAndTheJanissaries strategy', () => {
  describe('generateNewBoard', () => {
    it('should generate a board of 5 possibly empty soldier groups', () => {
      const board = generateNewBoard();
      expect(board).toHaveLength(5);
      expect(uniq(flatten(board))).toEqual(['blue']);
    });
  });

  describe('getGameStateAfterKillingGroup', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      expect(getGameStateAfterKillingGroup([[], ['red', 'red']], 'red')).toEqual({
        intermediateBoard: [[], []],
        newBoard: [[], []],
        isGameEnd: true,
        winnerIndex: 1
      });
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      expect(getGameStateAfterKillingGroup([['red', 'blue'], ['blue']], 'red')).toEqual({
        intermediateBoard: [['blue'], ['blue']],
        newBoard: [['blue'], []],
        isGameEnd: true,
        winnerIndex: 0
      });
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const board = [['red'], ['blue', 'red'], [], ['blue', 'blue']];
      expect(getGameStateAfterKillingGroup(board, 'red')).toEqual({
        intermediateBoard: [[], ['blue'], [], ['blue', 'blue']],
        newBoard: [['blue'], [], ['blue', 'blue'], []],
        isGameEnd: false
      });
    });
  });

  describe('getGameStateAfterAiTurn', () => {
    describe('when player is the first player', () => {
      it('should kill the group of the first soldier if there is any in the first row', () => {
        const board = [['blue', 'red', 'red'], ['red']];
        expect(getGameStateAfterAiTurn({ board, playerIndex: 0 })).toEqual({
          intermediateBoard: [['red', 'red'], ['red']],
          newBoard: [['red'], []],
          isGameEnd: true,
          winnerIndex: 0
        });
      });

      it('should kill the group with the bigger combined weight', () => {
        const board = [[], ['red'], ['blue', 'blue'], ['blue']];
        expect(getGameStateAfterAiTurn({ board, playerIndex: 0 })).toEqual({
          intermediateBoard: [[], ['red'], [], []],
          newBoard: [['red'], [], [], []],
          isGameEnd: false
        });
      });
    });

    describe('when player is the second player', () => {
      it('should split first row evenly if there are more soldiers', () => {
        const board = [['blue', 'blue']];
        expect(getGameStateAfterAiTurn({ board, playerIndex: 1 })).toEqual({
          newBoard: [expect.toIncludeSameMembers(['blue', 'red'])],
          isGameEnd: false
        });
      });

      it('should balance soldiers with smaller weight for later rows - v1', () => {
        const board = [
          ['blue'],
          ['blue'],
          [],
          ['blue', 'blue', 'blue', 'blue']
        ];
        const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
        expect(
          isEqual(newBoard, [['blue'], ['red'], [], ['red', 'red', 'red', 'red']]) ||
          isEqual(newBoard, [['red'], ['blue'], [], ['blue', 'blue', 'blue', 'blue']])
        ).toBe(true);
      });

      it('should balance soldiers with smaller weight for later rows - v2', () => {
        const board = [
          ['blue'],
          ['blue', 'blue', 'blue'],
          ['blue'],
          ['blue', 'blue']
        ];
        const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
        expect(
          isEqual(newBoard, [['blue'], ['red', 'red', 'blue'], ['red'], ['red', 'red']]) ||
          isEqual(newBoard, [['red'], ['blue', 'blue', 'red'], ['blue'], ['blue', 'blue']])
        ).toBe(true);
      });
    });
  });
});
