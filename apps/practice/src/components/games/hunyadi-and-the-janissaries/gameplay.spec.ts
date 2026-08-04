import {
  moves, generateStartBoard, isColor, isSoldierAssignmentAllowed, HUNYADI, SULTAN, type Board
} from './gameplay';
import { uniq, flatten } from 'lodash';
import { makeCtx } from '../../../test-utils';

describe('HunyadiAndTheJanissaries helpers', () => {
  describe('moves', () => {
    const meta = { ctx: makeCtx() };

    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      const { gameEnd } = moves.killGroup.apply([[], ['red', 'red']] as Board, meta, 'red');
      expect(gameEnd).toEqual({ winnerIndex: HUNYADI });
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      const { nextBoard, autoEndOfTurn } = moves.killGroup.apply(
        [[], ['red', 'blue'], ['blue']] as Board, meta, 'red'
      );
      expect(autoEndOfTurn).toBe(true);
      const { gameEnd } = moves.stepUp.apply(nextBoard);
      expect(gameEnd).toEqual({ winnerIndex: SULTAN });
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      const board = [[], ['red'], ['blue', 'red'], [], ['blue', 'blue']] as Board;
      const { nextBoard } = moves.killGroup.apply(board, meta, 'red');
      const outcome = moves.stepUp.apply(nextBoard);
      expect(outcome.nextBoard).toEqual([[], ['blue'], [], ['blue', 'blue'], []])
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
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
