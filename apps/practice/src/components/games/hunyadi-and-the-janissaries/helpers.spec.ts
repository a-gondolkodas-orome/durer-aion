import {
  moves, generateStartBoard, isColor, isSoldierAssignmentAllowed, type Board
} from './helpers';
import { uniq, flatten } from 'lodash';
import { makeEvents } from '../../../test-utils';

describe('HunyadiAndTheJanissaries helpers', () => {
  describe('moves', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      const events = makeEvents();
      moves.killGroup.apply([[], ['red', 'red']] as Board, { events }, 'red')
      expect(events.endGame).toHaveBeenCalledWith(1);
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      const events = makeEvents();
      const { nextBoard } = moves.killGroup.apply(
        [[], ['red', 'blue'], ['blue']] as Board, { events }, 'red'
      );
      moves.stepUp(nextBoard, { events });
      expect(events.endGame).toHaveBeenCalledWith(0);
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const events = makeEvents();
      const board = [[], ['red'], ['blue', 'red'], [], ['blue', 'blue']] as Board;
      const { nextBoard } = moves.killGroup.apply(board, { events }, 'red');
      const state = moves.stepUp(nextBoard, { events });
      expect(state.nextBoard).toEqual([[], ['blue'], [], ['blue', 'blue'], []])
      expect(events.endGame).not.toHaveBeenCalled();
    });
  });

  describe('legality', () => {
    const board = [[], ['red'], ['blue', 'red']] as Board;

    it('only accepts the two group colours', () => {
      expect(isColor('red')).toBe(true);
      expect(isColor('blue')).toBe(true);
      expect(isColor('green')).toBe(false);
      expect(isColor('')).toBe(false);
    });

    it('accepts an assignment of soldiers that are actually on the staircase', () => {
      expect(isSoldierAssignmentAllowed(board, [
        { rowIndex: 1, pieceIndex: 0, group: 'blue' },
        { rowIndex: 2, pieceIndex: 1, group: 'red' }
      ])).toBe(true);
    });

    it('rejects an assignment referring to a step or a position with no soldier', () => {
      expect(isSoldierAssignmentAllowed(board, [{ rowIndex: 0, pieceIndex: 0, group: 'red' }])).toBe(false);
      expect(isSoldierAssignmentAllowed(board, [{ rowIndex: 1, pieceIndex: 1, group: 'red' }])).toBe(false);
      expect(isSoldierAssignmentAllowed(board, [{ rowIndex: 9, pieceIndex: 0, group: 'red' }])).toBe(false);
    });

  });

  describe('generateStartBoard', () => {
    it('should generate a board of 5 + 1 possibly empty soldier groups', () => {
      const board = generateStartBoard();
      expect(board).toHaveLength(6);
      expect(uniq(flatten(board))).toEqual(['blue']);
    });
  });
});
