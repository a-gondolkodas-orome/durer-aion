import {
  type Grid, getRectangleAt, getRectangles, applyMove, isEmpty, getAllMoves, generateStartBoard
} from './helpers';

const g = (rows: number[][]): Grid => rows.map(r => r.map(Boolean));

describe('getRectangleAt', () => {
  it('returns the bounding box of a solid rectangle', () => {
    const grid = g([[1, 1, 1], [1, 1, 1]]);
    expect(getRectangleAt(grid, 0, 0)).toEqual({ minR: 0, maxR: 1, minC: 0, maxC: 2 });
  });

  it('returns null on an empty cell', () => {
    expect(getRectangleAt(g([[0]]), 0, 0)).toBeNull();
  });

  it('isolates a component separated by a gap', () => {
    const grid = g([[1, 1, 0, 1], [1, 1, 0, 1]]);
    expect(getRectangleAt(grid, 0, 3)).toEqual({ minR: 0, maxR: 1, minC: 3, maxC: 3 });
  });
});

describe('getRectangles', () => {
  it('finds all disjoint rectangles', () => {
    const grid = g([[1, 0, 1], [1, 0, 1], [0, 0, 0]]);
    const rects = getRectangles(grid);
    expect(rects).toHaveLength(2);
  });

  it('returns none for an empty board', () => {
    expect(getRectangles(g([[0, 0], [0, 0]]))).toHaveLength(0);
  });
});

describe('applyMove', () => {
  it('removing a middle row splits the rectangle in two', () => {
    const grid = g([[1, 1], [1, 1], [1, 1]]);
    const next = applyMove(grid, { r: 1, c: 0, orientation: 'row' });
    expect(next).toEqual(g([[1, 1], [0, 0], [1, 1]]));
    expect(getRectangles(next)).toHaveLength(2);
  });

  it('removing an edge column shrinks the rectangle', () => {
    const grid = g([[1, 1, 1], [1, 1, 1]]);
    const next = applyMove(grid, { r: 0, c: 2, orientation: 'col' });
    expect(next).toEqual(g([[1, 1, 0], [1, 1, 0]]));
  });

  it('only affects the targeted rectangle', () => {
    const grid = g([[1, 0, 1], [1, 0, 1]]);
    const next = applyMove(grid, { r: 0, c: 0, orientation: 'col' });
    // the whole left column-rectangle goes; the right one is untouched
    expect(next).toEqual(g([[0, 0, 1], [0, 0, 1]]));
  });

  it('does not mutate the input grid', () => {
    const grid = g([[1, 1]]);
    applyMove(grid, { r: 0, c: 0, orientation: 'row' });
    expect(grid).toEqual(g([[1, 1]]));
  });
});

describe('getAllMoves', () => {
  it('offers one move per row and column of each rectangle', () => {
    // single 2×3 rectangle: 2 row moves + 3 column moves
    expect(getAllMoves(g([[1, 1, 1], [1, 1, 1]]))).toHaveLength(5);
  });
});

describe('isEmpty', () => {
  it('detects an empty board', () => {
    expect(isEmpty(g([[0, 0], [0, 0]]))).toBe(true);
    expect(isEmpty(g([[0, 1]]))).toBe(false);
  });
});

describe('generateStartBoard', () => {
  it('always produces a full rectangular grid with sides in 2..6', () => {
    for (let i = 0; i < 50; i++) {
      const { grid } = generateStartBoard();
      expect(grid.length).toBeGreaterThanOrEqual(2);
      expect(grid.length).toBeLessThanOrEqual(6);
      expect(grid[0].length).toBeGreaterThanOrEqual(2);
      expect(grid[0].length).toBeLessThanOrEqual(6);
      expect(grid.every(row => row.every(Boolean))).toBe(true);
    }
  });
});
