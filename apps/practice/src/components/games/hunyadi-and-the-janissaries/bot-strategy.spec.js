'use strict';

import { getOptimalGroupToKill, getOptimalSoldierGroups } from './bot-strategy';
import { isEqual } from 'lodash';
import { moves } from './helpers';

describe('HunyadiAndTheJanissaries strategy', () => {
  describe('getOptimalGroupToKill', () => {
    it('should kill the group of the first soldier if there is any in the first row', () => {
      const board = [[], ['blue', 'red', 'red'], ['red']];
      expect(getOptimalGroupToKill(board)).toEqual('blue');
    });

    it('should kill the group with the bigger combined weight', () => {
      const board = [[], [], ['red'], ['blue', 'blue'], ['blue']];
      expect(getOptimalGroupToKill(board)).toEqual('blue');
    });
  });

  describe('getOptimalSoldierGroups', () => {
    it('should split first row evenly if there are more soldiers', () => {
      const board = [[], ['blue', 'blue']];
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
      expect(isEqual(nextBoard, [[], ['red', 'blue']]) || isEqual(nextBoard, [[], ['blue', 'red']]));
    });

    it('should balance soldiers with smaller weight for later rows - v1', () => {
      const board = [
        [],
        ['blue'],
        ['blue'],
        [],
        ['blue', 'blue', 'blue', 'blue']
      ];
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
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
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
      expect(
        isEqual(nextBoard, [[], ['blue'], ['red', 'red', 'blue'], ['red'], ['red', 'red']]) ||
        isEqual(nextBoard, [[], ['red'], ['blue', 'blue', 'red'], ['blue'], ['blue', 'blue']])
      ).toBe(true);
    });
  });
});
