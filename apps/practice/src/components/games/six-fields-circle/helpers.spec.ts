import { type Board, getLegalMoves, isOpposite, isRemovalAllowed } from './helpers';

describe('isRemovalAllowed', () => {
  const board: Board = [2, 1, 0, 3, 1, 1];

  it('accepts two non-empty fields that are not opposite each other', () => {
    expect(isRemovalAllowed(board, [0, 1])).toBe(true); // neighbours
    expect(isRemovalAllowed(board, [0, 4])).toBe(true); // second neighbours
  });

  it('accepts the pair in either order — the client hands it over in click order', () => {
    expect(isRemovalAllowed(board, [4, 0])).toBe(true);
    expect(isRemovalAllowed(board, [1, 0])).toBe(true);
  });

  it('refuses the three diameters', () => {
    expect(isRemovalAllowed(board, [0, 3])).toBe(false);
    expect(isRemovalAllowed(board, [1, 4])).toBe(false);
    expect(isRemovalAllowed([1, 1, 1, 1, 1, 1], [2, 5])).toBe(false);
  });

  it('refuses an empty field and the same field twice', () => {
    expect(isRemovalAllowed(board, [1, 2])).toBe(false); // field 2 is empty
    expect(isRemovalAllowed(board, [0, 0])).toBe(false);
  });

  it('refuses anything that is not one of the six field indices', () => {
    expect(isRemovalAllowed(board, [0, 6])).toBe(false);
    expect(isRemovalAllowed(board, [-1, 0])).toBe(false);
    expect(isRemovalAllowed(board, [0, 2.5])).toBe(false);
  });

  it('accepts every move the generator lists, and nothing else', () => {
    const listed = new Set(getLegalMoves(board).map(([i, j]) => `${i},${j}`));
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        expect(isRemovalAllowed(board, [i, j])).toBe(listed.has(`${i},${j}`));
      }
    }
  });

  it('agrees with isOpposite on which pairs are diameters', () => {
    const full: Board = [1, 1, 1, 1, 1, 1];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        expect(isRemovalAllowed(full, [i, j])).toBe(!isOpposite(i, j));
      }
    }
  });
});
