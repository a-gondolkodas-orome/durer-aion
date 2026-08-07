import { generateStartBoard, getAllowedMoves, markVisitedFields, moves } from './gameplay';
import { makeCtx } from 'test-utils';

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

describe('getAllowedMoves', () => {
  it('should return right and down moves from starting position', () => {
    const board = generateStartBoard();
    const moves = getAllowedMoves(board);
    expect(moves).toHaveLength(14);
    expect(moves).toEqual(expect.arrayContaining([
      { row: 0, col: 1 }, { row: 0, col: 7 },
      { row: 1, col: 0 }, { row: 7, col: 0 }
    ]));
  });

  it('should be blocked by visited squares', () => {
    const board = generateStartBoard();
    markVisitedFields(board, { row: 0, col: 0 }, { row: 0, col: 3 });
    board.chessBoard[0][3] = 'rook';
    board.rookPosition = { row: 0, col: 3 };
    // a visited square directly below the rook blocks the vertical path past it
    board.chessBoard[4][3] = 'visited';

    const moves = getAllowedMoves(board);
    expect(moves).not.toContainEqual({ row: 0, col: 0 });
    expect(moves).not.toContainEqual({ row: 0, col: 2 });
    expect(moves).toContainEqual({ row: 0, col: 4 });
    expect(moves).toContainEqual({ row: 3, col: 3 });
    expect(moves).not.toContainEqual({ row: 4, col: 3 });
    expect(moves).not.toContainEqual({ row: 5, col: 3 });
  });

  it('should return no moves when all paths are blocked', () => {
    const board = generateStartBoard();
    board.chessBoard[0][1] = 'visited';
    board.chessBoard[1][0] = 'visited';

    expect(getAllowedMoves(board)).toHaveLength(0);
  });
});

// The rook marks every square it crosses, so its runway shrinks each move; the
// player who leaves it stuck wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the move that strands the rook', () => {
    let board = generateStartBoard();
    let player = 0;
    let outcome = moves.moveRook.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.moveRook.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
