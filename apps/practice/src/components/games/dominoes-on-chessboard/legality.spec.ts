import { isDominoAllowed, type Board, type Domino } from './dominoes-on-chessboard';

const emptyBoard: Board = [];

describe('isDominoAllowed', () => {
  it('allows a domino covering two uncovered neighbours', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(true);
  });

  it('allows the two fields in either order', () => {
    // the smart bot mirrors the opponent's domino through the board's centre,
    // which reverses the pair relative to how the move generator lists it
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 1 }, { row: 0, col: 0 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, [{ row: 1, col: 0 }, { row: 0, col: 0 }])).toBe(true);
  });

  it('rejects fields that are not neighbours', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 0, col: 2 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 1, col: 1 }])).toBe(false);
  });

  it('rejects a domino overlapping one already placed', () => {
    const board: Board = [[{ row: 0, col: 0 }, { row: 0, col: 1 }]];
    expect(isDominoAllowed(board, [{ row: 0, col: 1 }, { row: 0, col: 2 }])).toBe(false);
    expect(isDominoAllowed(board, [{ row: 0, col: 2 }, { row: 0, col: 3 }])).toBe(true);
  });

  it('rejects fields off the board', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 5 }, { row: 0, col: 6 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: -1, col: 0 }, { row: 0, col: 0 }])).toBe(false);
  });

  it('rejects anything that is not a pair of fields', () => {
    expect(isDominoAllowed(emptyBoard, undefined as unknown as Domino)).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }] as unknown as Domino)).toBe(false);
  });
});
