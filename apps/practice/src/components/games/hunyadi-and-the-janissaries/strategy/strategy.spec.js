'use strict';

import { generateStartBoard, getGameStateAfterKillingGroup, getGameStateAfterAiTurn } from './strategy';
import { uniq, flatten, isEqual } from 'lodash';

describe('HunyadiAndTheJanissaries strategy', () => {
  describe('generateStartBoard', () => {
    it('should generate a board of 5 + 1 possibly empty soldier groups', () => {
      const board = generateStartBoard();
      expect(board).toHaveLength(6);
      expect(uniq(flatten(board))).toEqual(['blue']);
    });
  });

  describe('getGameStateAfterKillingGroup', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      expect(getGameStateAfterKillingGroup([[], ['red', 'red']], 'red')).toEqual({
        intermediateBoard: [[], []],
        nextBoard: [[], []],
        isGameEnd: true,
        winnerIndex: 1
      });
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      expect(getGameStateAfterKillingGroup([[], ['red', 'blue'], ['blue']], 'red')).toEqual({
        intermediateBoard: [[], ['blue'], ['blue']],
        nextBoard: [['blue'], ['blue'], []],
        isGameEnd: true,
        winnerIndex: 0
      });
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const board = [[], ['red'], ['blue', 'red'], [], ['blue', 'blue']];
      expect(getGameStateAfterKillingGroup(board, 'red')).toEqual({
        intermediateBoard: [[], [], ['blue'], [], ['blue', 'blue']],
        nextBoard: [[], ['blue'], [], ['blue', 'blue'], []],
        isGameEnd: false
      });
    });
  });

  describe('getGameStateAfterAiTurn', () => {
    describe('when player is the first player', () => {
      it('should kill the group of the first soldier if there is any in the first row', () => {
        const board = [[], ['blue', 'red', 'red'], ['red']];
        expect(getGameStateAfterAiTurn({ board, ctx: { chosenRoleIndex: 0 } })).toEqual({
          intermediateBoard: [[], ['red', 'red'], ['red']],
          nextBoard: [['red', 'red'], ['red'], []],
          isGameEnd: true,
          winnerIndex: 0
        });
      });

      it('should kill the group with the bigger combined weight', () => {
        const board = [[], [], ['red'], ['blue', 'blue'], ['blue']];
        expect(getGameStateAfterAiTurn({ board, ctx: { chosenRoleIndex: 0 } })).toEqual({
          intermediateBoard: [[], [], ['red'], [], []],
          nextBoard: [[], ['red'], [], [], []],
          isGameEnd: false
        });
      });
    });

    describe('when player is the second player', () => {
      it('should split first row evenly if there are more soldiers', () => {
        const board = [[], ['blue', 'blue']];
        expect(getGameStateAfterAiTurn({ board, ctx: { chosenRoleIndex: 1 } })).toEqual({
          nextBoard: [[], expect.toIncludeSameMembers(['blue', 'red'])],
          isGameEnd: false
        });
      });

      it('should balance soldiers with smaller weight for later rows - v1', () => {
        const board = [
          [],
          ['blue'],
          ['blue'],
          [],
          ['blue', 'blue', 'blue', 'blue']
        ];
        const { nextBoard } = getGameStateAfterAiTurn({ board, ctx: { chosenRoleIndex: 1 } });
        expect(
          isEqual(nextBoard, [[], ['blue'], ['red'], [], ['red', 'red', 'red', 'red']]) ||
          isEqual(nextBoard, [[], ['red'], ['blue'], [], ['blue', 'blue', 'blue', 'blue']])
        ).toBe(true);
      });

      it('should balance soldiers with smaller weight for later rows - v2', () => {
        const board = [
          [],
          ['blue'],
          ['blue', 'blue', 'blue'],
          ['blue'],
          ['blue', 'blue']
        ];
        const { nextBoard } = getGameStateAfterAiTurn({ board, ctx: { chosenRoleIndex: 1 } });
        expect(
          isEqual(nextBoard, [[], ['blue'], ['red', 'red', 'blue'], ['red'], ['red', 'red']]) ||
          isEqual(nextBoard, [[], ['red'], ['blue', 'blue', 'red'], ['blue'], ['blue', 'blue']])
        ).toBe(true);
      });
    });
  });
});
