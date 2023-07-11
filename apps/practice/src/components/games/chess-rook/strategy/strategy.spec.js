import { generateNewBoard, getGameStateAfterAiTurn, getGameStateAfterMove } from './strategy';
import { isEqual } from 'lodash';

describe('chess rook', () => {
  describe('getGameStateAfterMove()', () => {
    it('should mark visited fields and move rook to given position', () => {
      const board = generateNewBoard();
      const res = getGameStateAfterMove(board, { row: 6, col: 0 }).newBoard;
      expect(res.chessBoard[0][0]).toEqual('visited');
      expect(res.chessBoard[1][0]).toEqual('visited');
      expect(res.chessBoard[5][0]).toEqual('visited');
      expect(res.chessBoard[6][0]).toEqual('rook');
      expect(res.rookPosition).toEqual({ row: 6, col: 0 });
    });
  });

  describe('getGameStateAfterAiTurn()', () => {
    it('should move to end of row or column as a first step', () => {
      const board = generateNewBoard();
      const rookPosition = getGameStateAfterAiTurn({ board }).newBoard.rookPosition;
      expect(
        isEqual(rookPosition, { row: 0, col: 7 }) ||
        isEqual(rookPosition, { row: 7, col: 0 })
      ).toBe(true);
    });

    it('should create a narrow rectangle if possible', () => {
      const board = generateNewBoard();
      const { newBoard } = getGameStateAfterMove(board, { row: 0, col: 5 });
      const rookPosition = getGameStateAfterAiTurn({ board: newBoard }).newBoard.rookPosition;
      expect(rookPosition).toEqual({ row: 7, col: 5 });
    });
  });
});
