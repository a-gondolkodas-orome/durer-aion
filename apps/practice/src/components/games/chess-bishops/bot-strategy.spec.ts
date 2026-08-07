import lodash from 'lodash';
import { smartBotStrategy } from './bot-strategy';
import { generateStartBoard, BISHOP, markForbiddenFields, type Board, type Field } from './gameplay'
import { botNextMoveArgs, makeCtx } from 'test-utils';

const smartBotPlacement = (board: Board): Field =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }))[0];

describe('test bishop strategy', () => {
  describe('smartBotStrategy', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('places 2nd bishop at the horizontal mirror position when horizontal axis is chosen', () => {
      // random(0, 1) === 1 selects the horizontal axis
      vi.spyOn(lodash, 'random').mockReturnValue(1);
      const board = generateStartBoard();
      markForbiddenFields(board, { row: 1, col: 5 });
      board[1][5] = BISHOP;
      const res = smartBotPlacement(board);
      expect(res).toEqual({ row: 1, col: 2 });
    });

    it('places 2nd bishop at the vertical mirror position when vertical axis is chosen', () => {
      // random(0, 1) === 0 selects the vertical axis
      vi.spyOn(lodash, 'random').mockReturnValue(0);
      const board = generateStartBoard();
      markForbiddenFields(board, { row: 1, col: 5 });
      board[1][5] = BISHOP;
      const res = smartBotPlacement(board);
      expect(res).toEqual({ row: 6, col: 5 });
    });

    it('places 4th bishop at a mirror position according to chosen axis', () => {
      const board = generateStartBoard();
      markForbiddenFields(board, { row: 1, col: 5 });
      board[1][5] = BISHOP;
      const move2 = smartBotPlacement(board);
      markForbiddenFields(board, move2);
      board[move2.row][move2.col] = BISHOP;
      markForbiddenFields(board, { row: 6, col: 4 });
      board[6][4] = BISHOP;
      const move4 = smartBotPlacement(board);
      expect([
        [{ row: 1, col: 2 }, { row: 6, col: 3 }],
        [{ row: 6, col: 5 }, { row: 1, col: 4 }]
      ]).toContainEqual([move2, move4]);
    });
  });
});
