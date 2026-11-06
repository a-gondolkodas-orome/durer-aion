import { range } from 'lodash';
import { generateStartBoard, getAllowedMoves, moves, type Board, type CellValue } from './gameplay';
import { makeCtx } from 'test-utils';

// A 4x4 board with the knight at `knightPosition` and `visited` already toured.
const boardWith = (knightPosition: { row: number; col: number }, visited: number[][] = []): Board => {
  const chessBoard: CellValue[][] = range(4).map(() => range(4).map((): CellValue => null));
  visited.forEach(([row, col]) => { chessBoard[row][col] = 'visited'; });
  chessBoard[knightPosition.row][knightPosition.col] = 'knight';
  return { chessBoard, knightPosition };
};

const sorted = (fields: { row: number; col: number }[]) =>
  [...fields].sort((a, b) => a.row - b.row || a.col - b.col);

describe('getAllowedMoves', () => {
  it('offers exactly the knight jumps that stay on the 4x4 board', () => {
    // From (1,1) only four of the eight L-shapes land on the board; the other
    // four run off the top or the left edge.
    expect(sorted(getAllowedMoves(boardWith({ row: 1, col: 1 })))).toEqual(sorted([
      { row: 0, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 2 }
    ]));
  });

  it('never offers a step that is not an L-shape', () => {
    for (const { row, col } of getAllowedMoves(boardWith({ row: 1, col: 2 }))) {
      const dRow = Math.abs(row - 1), dCol = Math.abs(col - 2);
      expect([dRow, dCol].sort()).toEqual([1, 2]);
    }
  });

  it('drops every square the knight has already visited', () => {
    const free = getAllowedMoves(boardWith({ row: 0, col: 0 }));
    expect(free).toContainEqual({ row: 1, col: 2 });

    const withVisit = getAllowedMoves(boardWith({ row: 0, col: 0 }, [[1, 2]]));
    expect(withVisit).not.toContainEqual({ row: 1, col: 2 });
    expect(withVisit).toContainEqual({ row: 2, col: 1 });
  });

  it('leaves the knight stranded once every reachable square is visited', () => {
    // The corner (0,0) reaches only (1,2) and (2,1).
    expect(getAllowedMoves(boardWith({ row: 0, col: 0 }, [[1, 2], [2, 1]]))).toEqual([]);
  });
});

describe('generateStartBoard', () => {
  it('puts a single knight on the board and marks nothing visited', () => {
    for (let i = 0; i < 50; i++) {
      const { chessBoard, knightPosition } = generateStartBoard();
      const cells = chessBoard.flat();
      expect(cells.filter(cell => cell === 'knight')).toHaveLength(1);
      expect(cells.filter(cell => cell === 'visited')).toHaveLength(0);
      expect(chessBoard[knightPosition.row][knightPosition.col]).toBe('knight');
    }
  });
});

// The knight may never revisit a square, so the tour dies out on its own; the
// player who makes the last move wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('moves.moveKnight', () => {
  it('marks the square the knight leaves, so it can never be re-entered', () => {
    const board = boardWith({ row: 0, col: 0 });
    const { nextBoard } = moves.moveKnight.apply(board, asPlayer(0), { row: 1, col: 2 });
    expect(nextBoard.chessBoard[0][0]).toBe('visited');
    expect(nextBoard.chessBoard[1][2]).toBe('knight');
    expect(nextBoard.knightPosition).toEqual({ row: 1, col: 2 });
    // the start square is off limits from now on, exactly as the rule says
    expect(getAllowedMoves(nextBoard)).not.toContainEqual({ row: 0, col: 0 });
  });
});

describe('end of game', () => {
  it('ends exactly on the move that strands the knight', () => {
    let board = generateStartBoard();
    let player = 0;
    let outcome = moves.moveKnight.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.moveKnight.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
