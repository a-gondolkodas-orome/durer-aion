import { isDominoAllowed, type Board, type Domino } from './dominoes-4x4';

const emptyBoard: Board = [];
// Player 0 (Árgyélus) places vertical dominoes, player 1 (Félix) horizontal ones.
const VERTICAL = 0;
const HORIZONTAL = 1;

describe('isDominoAllowed', () => {
  it('allows a domino along the current player’s own axis', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, HORIZONTAL, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(true);
  });

  it('rejects a domino along the other player’s axis', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, HORIZONTAL, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(false);
  });

  it('allows the two fields in either order', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 1, col: 0 }, { row: 0, col: 0 }])).toBe(true);
  });

  it('rejects a domino overlapping one already placed', () => {
    const board: Board = [[{ row: 0, col: 0 }, { row: 1, col: 0 }]];
    expect(isDominoAllowed(board, VERTICAL, [{ row: 1, col: 0 }, { row: 2, col: 0 }])).toBe(false);
    expect(isDominoAllowed(board, VERTICAL, [{ row: 2, col: 0 }, { row: 3, col: 0 }])).toBe(true);
  });

  it('rejects fields off the board', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 3, col: 0 }, { row: 4, col: 0 }])).toBe(false);
  });

  it('rejects anything that is not a pair of fields', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, undefined as unknown as Domino)).toBe(false);
  });
});
