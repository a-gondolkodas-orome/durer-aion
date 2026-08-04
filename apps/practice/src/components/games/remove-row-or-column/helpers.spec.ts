import {
  type Board, type Grid, type Move,
  getRectangleAt, getRectangles, applyMove, isEmpty, getAllMoves, isRemovalAllowed, moves
} from './helpers';
import { makeCtx } from '../../../test-utils';

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

describe('isRemovalAllowed', () => {
  const grid = g([
    [1, 1, 0],
    [1, 1, 0],
    [0, 0, 1]
  ]);

  it('accepts either orientation on any cell holding a disc', () => {
    expect(isRemovalAllowed(grid, { r: 0, c: 0, orientation: 'row' })).toBe(true);
    expect(isRemovalAllowed(grid, { r: 0, c: 0, orientation: 'col' })).toBe(true);
    expect(isRemovalAllowed(grid, { r: 2, c: 2, orientation: 'row' })).toBe(true);
  });

  it('refuses an empty cell — there is no rectangle around one to remove a line from', () => {
    expect(isRemovalAllowed(grid, { r: 0, c: 2, orientation: 'row' })).toBe(false);
    expect(isRemovalAllowed(grid, { r: 2, c: 0, orientation: 'col' })).toBe(false);
  });

  it('refuses a cell off the grid', () => {
    expect(isRemovalAllowed(grid, { r: -1, c: 0, orientation: 'row' })).toBe(false);
    expect(isRemovalAllowed(grid, { r: 0, c: 9, orientation: 'row' })).toBe(false);
    expect(isRemovalAllowed(grid, { r: 9, c: 0, orientation: 'row' })).toBe(false);
  });

  // The board client builds the move by spreading the selected disc into
  // `{ ...selected, orientation }`, so with nothing selected it has no r/c at
  // all. That is what makes the selection itself part of legality — the client
  // needs no null-check of its own.
  it('refuses a move with no disc named at all', () => {
    expect(isRemovalAllowed(grid, { orientation: 'row' } as Move)).toBe(false);
  });

  it('accepts every move the generator lists', () => {
    expect(getAllMoves(grid).every(m => isRemovalAllowed(grid, m))).toBe(true);
  });
});

// Whoever takes the last disc off the board wins; the selected disc parked in
// ctx.turnState is cleared either way.
describe('end of game', () => {
  const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });
  const board = (grid: boolean[][]): Board => ({ grid });

  it.each([0, 1])('ends for the mover (player %i) when the last discs come off', p => {
    const outcome = moves.removeLine.apply(
      board([[true, true]]), asPlayer(p), { r: 0, c: 0, orientation: 'row' }
    );
    expect(isEmpty(outcome.nextBoard.grid)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
    expect(outcome.nextTurnState).toBeNull();
  });

  it('passes the turn while discs remain', () => {
    const outcome = moves.removeLine.apply(
      board([[true, true], [true, true]]), asPlayer(0), { r: 0, c: 0, orientation: 'row' }
    );
    expect(isEmpty(outcome.nextBoard.grid)).toBe(false);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.nextTurnState).toBeNull();
  });
});
