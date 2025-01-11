import { getOptimalAiMove } from './bot-strategy';
import { generateStartBoard, markVisitedFields } from './helpers';
import { isEqual, cloneDeep } from 'lodash';

describe('chess rook', () => {
  describe('getGameStateAfterAiTurn()', () => {
    it('should move to end of row or column as a first step', () => {
      const board = generateStartBoard();
      const rookPosition = getOptimalAiMove(board);
      expect(
        isEqual(rookPosition, { row: 0, col: 7 }) ||
        isEqual(rookPosition, { row: 7, col: 0 })
      ).toBe(true);
    });

    it('should create a narrow rectangle if possible', () => {
      const board = generateStartBoard();

      const nextBoard = cloneDeep(board);
      markVisitedFields(nextBoard, nextBoard.rookPosition, { row: 0, col: 5 });
      nextBoard.chessBoard[0][5] = 'rook';
      nextBoard.rookPosition = { row: 0, col: 5 };

      const rookPosition = getOptimalAiMove(nextBoard);
      expect(rookPosition).toEqual({ row: 7, col: 5 });
    });
  });
});
