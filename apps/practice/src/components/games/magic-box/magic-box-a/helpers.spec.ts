import { hasFullLine, generateEmptyBoard, isPlacementAllowed } from './helpers';

describe('hasFullLine', () => {
  it('should be false for an empty board', () => {
    expect(hasFullLine(generateEmptyBoard())).toBe(false);
  });

  it('should be true if a row is fully occupied', () => {
    const board = [
      true, true, true,
      false, false, false,
      false, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be true if a column is fully occupied', () => {
    const board = [
      true, false, false,
      true, false, false,
      true, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be false for the maximal 6-stone configuration with no full line', () => {
    // diagonal cells [0, 4, 8] left empty, the other six filled
    const board = [
      false, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(false);
  });

  it('should be true once a 7th stone is added to the maximal configuration', () => {
    const board = [
      true, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });
});

describe('isPlacementAllowed', () => {
  it('allows any empty compartment', () => {
    const board = generateEmptyBoard();
    expect([0, 4, 8].every(id => isPlacementAllowed(board, id))).toBe(true);
  });

  it('rejects a compartment that already holds a stone', () => {
    const board = generateEmptyBoard();
    board[4] = true;
    expect(isPlacementAllowed(board, 4)).toBe(false);
    expect(isPlacementAllowed(board, 3)).toBe(true);
  });

  it('rejects a compartment outside the box', () => {
    const board = generateEmptyBoard();
    expect(isPlacementAllowed(board, 9)).toBe(false);
    expect(isPlacementAllowed(board, -1)).toBe(false);
    expect(isPlacementAllowed(board, 1.5)).toBe(false);
  });
});
