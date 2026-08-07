import { smartBotStrategy } from './bot-strategy';
import { generateStartBoard, markVisitedFields, type Board, type Field } from './gameplay';
import { botNextMoveArgs, makeCtx } from 'test-utils';
import { isEqual, cloneDeep } from 'lodash';

const smartBotTarget = (board: Board): Field =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }))[0];

describe('chess rook', () => {
  describe('smartBotStrategy', () => {
    it('should move to end of row or column as a first step', () => {
      const rookPosition = smartBotTarget(generateStartBoard());
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

      expect(smartBotTarget(nextBoard)).toEqual({ row: 7, col: 5 });
    });
  });
});
