import { DUCK, FORBIDDEN, isPlacementAllowed, getAllowedMoves, type Board } from './helpers';

const emptyBoard = (rows: number, cols: number): Board =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

describe('isPlacementAllowed', () => {
  it('accepts a free field', () => {
    expect(isPlacementAllowed(emptyBoard(4, 6), { row: 0, col: 0 })).toBe(true);
    expect(isPlacementAllowed(emptyBoard(4, 6), { row: 3, col: 5 })).toBe(true);
  });

  it('refuses a field that already holds a duck', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = DUCK;
    expect(isPlacementAllowed(board, { row: 1, col: 2 })).toBe(false);
  });

  it('refuses a field a duck attacks', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = FORBIDDEN;
    expect(isPlacementAllowed(board, { row: 1, col: 2 })).toBe(false);
  });

  it('refuses a field off the board', () => {
    const board = emptyBoard(4, 6);
    expect(isPlacementAllowed(board, { row: -1, col: 0 })).toBe(false);
    expect(isPlacementAllowed(board, { row: 4, col: 0 })).toBe(false);
    expect(isPlacementAllowed(board, { row: 0, col: 6 })).toBe(false);
  });

  it('accepts exactly the fields the generator lists', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = DUCK;
    board[0][2] = FORBIDDEN;
    board[1][1] = FORBIDDEN;
    const listed = new Set(getAllowedMoves(board).map(f => `${f.row},${f.col}`));
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        expect(isPlacementAllowed(board, { row, col })).toBe(listed.has(`${row},${col}`));
      }
    }
  });
});
