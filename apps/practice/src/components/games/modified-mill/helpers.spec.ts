import {
  generateEmptyBoard, playerColor, playerHasLine, isBoardFull, boardMasks,
  completesLine, hasLine, isPlacementAllowed, CELL_COUNT
} from './helpers';
import { LINES, SYMMETRIES } from './board-data';
import { canonicalize } from './bot-strategy';

const applyPerm = (mask: number, perm: number[]): number => {
  let result = 0;
  for (let i = 0; i < CELL_COUNT; i++) if (mask & (1 << i)) result |= 1 << perm[i];
  return result;
};

describe('modified mill helpers', () => {
  it('has a 24-cell board and 16 winning lines of three cells each', () => {
    // 12 square sides + 4 corner diagonals; no radial spokes between squares.
    expect(CELL_COUNT).toBe(24);
    expect(LINES).toHaveLength(16);
    expect(LINES.every((line) => line.length === 3)).toBe(true);
  });

  it('maps player index to disc colour', () => {
    expect(playerColor(0)).toBe('red');
    expect(playerColor(1)).toBe('blue');
  });

  it('detects three of a colour in a line as a win for that player', () => {
    const board = generateEmptyBoard();
    const [a, b, c] = LINES[0];
    board[a] = 'red';
    board[b] = 'red';
    board[c] = 'red';
    expect(playerHasLine(board, 0)).toBe(true);
    expect(playerHasLine(board, 1)).toBe(false);
  });

  it('two of a colour in a line is not yet a win', () => {
    const board = generateEmptyBoard();
    const [a, b] = LINES[0];
    board[a] = 'red';
    board[b] = 'red';
    expect(playerHasLine(board, 0)).toBe(false);
  });

  it('completesLine flags exactly the cell that finishes a line', () => {
    const board = generateEmptyBoard();
    const [a, b, c] = LINES[5];
    board[a] = 'blue';
    board[b] = 'blue';
    const { blue } = boardMasks(board);
    expect(completesLine(blue, c)).toBe(true);
    expect(hasLine(blue)).toBe(false);
  });

  it('recognises a full board', () => {
    const board = generateEmptyBoard();
    expect(isBoardFull(board)).toBe(false);
    board.fill('red');
    expect(isBoardFull(board)).toBe(true);
  });

  it('allows placing on an empty cell but not on an occupied one', () => {
    const board = generateEmptyBoard();
    board[7] = 'red';
    board[8] = 'blue';
    expect(isPlacementAllowed(board, 0)).toBe(true);
    expect(isPlacementAllowed(board, 7)).toBe(false);
    expect(isPlacementAllowed(board, 8)).toBe(false);
  });

  it('rejects cells outside the board', () => {
    const board = generateEmptyBoard();
    expect(isPlacementAllowed(board, -1)).toBe(false);
    expect(isPlacementAllowed(board, CELL_COUNT)).toBe(false);
    expect(isPlacementAllowed(board, 1.5)).toBe(false);
  });

  it('canonicalize gives every symmetric image of a position the same key', () => {
    const board = generateEmptyBoard();
    board[LINES[0][0]] = 'red';
    board[LINES[3][1]] = 'blue';
    board[LINES[7][2]] = 'red';
    const { red, blue } = boardMasks(board);
    const base = canonicalize(red, blue).key;

    // Applying any of the 8 board symmetries must not change the canonical key.
    for (const perm of SYMMETRIES) {
      expect(canonicalize(applyPerm(red, perm), applyPerm(blue, perm)).key).toBe(base);
    }
  });
});
