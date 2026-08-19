import { sum } from 'lodash';
import { isLosingForMover } from '../gameplay';
import { generateStartBoard } from './gameplay';

const DRAWS = 200;

describe('pile-splitter-3 start boards', () => {
  it('always deals 37 pieces into three non-empty piles', () => {
    Array.from({ length: DRAWS }, generateStartBoard).forEach(board => {
      expect(board).toHaveLength(3);
      expect(sum(board)).toEqual(37);
      expect(Math.min(...board)).toBeGreaterThanOrEqual(1);
    });
  });

  // The rules fix the total at 37, an odd number, so the two piles the
  // generator does not fix outright always share a parity: a board is either
  // all odd, which the mover has already lost, or holds exactly two even piles,
  // which the mover wins. Both have to come up, or one role would always win.
  it('deals both roles a winnable board', () => {
    const boards = Array.from({ length: DRAWS }, generateStartBoard);
    const wonByMover = boards.filter(board => !isLosingForMover(board)).length;

    expect(wonByMover).toBeGreaterThan(DRAWS / 4);
    expect(wonByMover).toBeLessThan(3 * DRAWS / 4);
  });
});
