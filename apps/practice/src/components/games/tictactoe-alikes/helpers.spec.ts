import { validatePlacement, generateEmptyTicTacToeBoard, type Board } from './helpers';

const isPlacementAllowed = (board: Board, id: number) => validatePlacement(board, undefined, id);

describe('tictactoe-alikes shared placement legality', () => {
  it('allows placing on any cell of an empty board', () => {
    const board = generateEmptyTicTacToeBoard();
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].every(id => isPlacementAllowed(board, id))).toBe(true);
  });

  it('rejects placing on an occupied cell', () => {
    const board: Board = [null, 'red', null, null, 'blue', null, null, null, null];
    expect(isPlacementAllowed(board, 1)).toBe(false);
    expect(isPlacementAllowed(board, 4)).toBe(false);
  });

  it('still allows the empty cells of a partly filled board', () => {
    const board: Board = [null, 'red', null, null, 'blue', null, null, null, null];
    expect(isPlacementAllowed(board, 0)).toBe(true);
    expect(isPlacementAllowed(board, 8)).toBe(true);
  });

  it('rejects cells outside the board', () => {
    const board = generateEmptyTicTacToeBoard();
    expect(isPlacementAllowed(board, -1)).toBe(false);
    expect(isPlacementAllowed(board, 9)).toBe(false);
    expect(isPlacementAllowed(board, 1.5)).toBe(false);
  });
});
