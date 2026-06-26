import { moves, generateStartBoard, type Board } from './helpers';
import { uniq, flatten } from 'lodash';
import { makeEvents } from '../../../test-utils';

describe('HunyadiAndTheJanissaries helpers', () => {
  describe('moves', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      const events = makeEvents();
      moves.killGroup([[], ['red', 'red']] as Board, { events }, 'red')
      expect(events.endGame).toHaveBeenCalledWith(1);
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      const events = makeEvents();
      const { nextBoard } = moves.killGroup(
        [[], ['red', 'blue'], ['blue']] as Board, { events }, 'red'
      );
      moves.stepUp(nextBoard, { events });
      expect(events.endGame).toHaveBeenCalledWith(0);
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const events = makeEvents();
      const board = [[], ['red'], ['blue', 'red'], [], ['blue', 'blue']] as Board;
      const { nextBoard } = moves.killGroup(board, { events }, 'red');
      const state = moves.stepUp(nextBoard, { events });
      expect(state.nextBoard).toEqual([[], ['blue'], [], ['blue', 'blue'], []])
      expect(events.endGame).not.toHaveBeenCalled();
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
