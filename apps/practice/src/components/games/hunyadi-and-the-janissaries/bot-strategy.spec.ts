import { getOptimalGroupToKill, getOptimalSoldierGroups } from './bot-strategy';
import { moves, type Board } from './helpers';

describe('HunyadiAndTheJanissaries strategy', () => {
  describe('getOptimalGroupToKill', () => {
    it('should kill the group of the first soldier if there is any in the first row', () => {
      const board = [[], ['blue', 'red', 'red'], ['red']] as Board;
      expect(getOptimalGroupToKill(board)).toEqual('blue');
    });

    it('should kill the group with the bigger combined weight', () => {
      const board = [[], [], ['red'], ['blue', 'blue'], ['blue']] as Board;
      expect(getOptimalGroupToKill(board)).toEqual('blue');
    });
  });

  describe('getOptimalSoldierGroups', () => {
    it('should split first row evenly if there are more soldiers', () => {
      const board = [[], ['blue', 'blue']] as Board;
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
      expect([[[], ['red', 'blue']], [[], ['blue', 'red']]]).toContainEqual(nextBoard);
    });

    it('should balance soldiers with smaller weight for later rows - v1', () => {
      const board = [
        [],
        ['blue'],
        ['blue'],
        [],
        ['blue', 'blue', 'blue', 'blue']
      ] as Board;
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
      expect([
        [[], ['blue'], ['red'], [], ['red', 'red', 'red', 'red']],
        [[], ['red'], ['blue'], [], ['blue', 'blue', 'blue', 'blue']]
      ]).toContainEqual(nextBoard);
    });

    it('should balance soldiers with smaller weight for later rows - v2', () => {
      const board = [
        [],
        ['blue'],
        ['blue', 'blue', 'blue'],
        ['blue'],
        ['blue', 'blue']
      ] as Board;
      const soldiers = getOptimalSoldierGroups(board);
      const { nextBoard } = moves.setGroupOfSoldiers(board, {}, soldiers);
      expect([
        [[], ['blue'], ['red', 'red', 'blue'], ['red'], ['red', 'red']],
        [[], ['red'], ['blue', 'blue', 'red'], ['blue'], ['blue', 'blue']]
      ]).toContainEqual(nextBoard);
    });
  });
});
