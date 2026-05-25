import { moves, generateStartBoard, type Board } from './helpers';
import type { Events } from '../../game-factory';
import { uniq, flatten } from 'lodash';

describe('HunyadiAndTheJanissaries helpers', () => {
  describe('moves', () => {
    it('should claim victory for Hunyadi if all soldiers are killed', () => {
      let winnerIndexMock;
      const events: Events = {
        endTurn: () => {},
        endGame: (winnerIndex) => { winnerIndexMock = winnerIndex },
        setTurnState: () => {}
      }
      moves.killGroup([[], ['red', 'red']] as Board, { events }, 'red')
      expect(winnerIndexMock).toBe(1);
    });

    it('should claim loss for Hunyadi if a soldier reaches the castle', () => {
      let winnerIndexMock;
      const events: Events = {
        endTurn: () => {},
        endGame: (winnerIndex) => { winnerIndexMock = winnerIndex; },
        setTurnState: () => {}
      }
      const { nextBoard } = moves.killGroup(
        [[], ['red', 'blue'], ['blue']] as Board, { events }, 'red'
      );
      moves.stepUp(nextBoard, { events });
      expect(winnerIndexMock).toBe(0);
    });

    it('should report game as still in progress and advance remaining soldiers otherwise', () => {
      let endGameCalled = false;
      const events: Events = {
        endTurn: () => {},
        endGame: () => { endGameCalled = true; },
        setTurnState: () => {}
      }
      const board = [[], ['red'], ['blue', 'red'], [], ['blue', 'blue']] as Board;
      const { nextBoard } = moves.killGroup(board, { events }, 'red');
      const state = moves.stepUp(nextBoard, { events });
      expect(state.nextBoard).toEqual([[], ['blue'], [], ['blue', 'blue'], []])
      expect(endGameCalled).toBe(false);
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
