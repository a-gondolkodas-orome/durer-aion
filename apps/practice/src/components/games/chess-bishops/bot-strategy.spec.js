import { getOptimalAiMove } from './bot-strategy';
import { generateStartBoard, BISHOP, markForbiddenFields } from './helpers'
import { isEqual } from 'lodash';

describe('test bishop strategy', () => {
  describe('getOptimalAiMove()', () => {
    it('places 2nd bishop at a mirror position', () => {
      const board = generateStartBoard();
      markForbiddenFields(board, { row: 1, col: 5 });
      board[1][5] = BISHOP;
      const res = getOptimalAiMove(board);
      expect(isEqual({ row: 1, col: 2 }, res) || isEqual({ row: 6, col: 5 }, res)).toBe(true);
    });

    it('places 4th bishop at a mirror position according to chosen axis', () => {
      const board = generateStartBoard();
      markForbiddenFields(board, { row: 1, col: 5 });
      board[1][5] = BISHOP;
      const move2 = getOptimalAiMove(board);
      markForbiddenFields(board, move2);
      board[move2.row][move2.col] = BISHOP;
      markForbiddenFields(board, { row: 6, col: 4 });
      board[6][4] = BISHOP;
      const move4 = getOptimalAiMove(board);
      expect(
        (isEqual({ row: 1, col: 2 }, move2) && isEqual({ row: 6, col: 3 }, move4)) ||
        (isEqual({ row: 6, col: 5 }, move2) && isEqual({ row: 1, col: 4 }, move4))
      ).toBe(true);
    });
  });
});
