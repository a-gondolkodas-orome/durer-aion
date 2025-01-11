import { generateStartBoard, markVisitedFields } from "./helpers";

describe('markVisitedFields', () => {
  it('should mark visited fields', () => {
    const board = generateStartBoard();
    markVisitedFields(board, { row: 0, col: 0 }, { row: 6, col: 0 });
    expect(board.chessBoard[0][0]).toEqual('visited');
    expect(board.chessBoard[1][0]).toEqual('visited');
    expect(board.chessBoard[5][0]).toEqual('visited');
    expect(board.chessBoard[6][0]).not.toEqual('visited');
  });
});
