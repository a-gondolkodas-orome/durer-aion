import { range } from 'lodash';
import { moves, isColoringAllowed } from './gameplay';
import { makeCtx } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const [ALLOWED, COLORED, FORBIDDEN] = [1, 2, 3] as const;
type Board = Parameters<typeof moves.colorTriangle.apply>[0];
const allowedTriangles = (board: Board) => range(16).filter(i => isColoringAllowed(board, i));

describe('isColoringAllowed', () => {
  const gridWith = (overrides: Record<number, 1 | 2 | 3> = {}) =>
    Array.from({ length: 16 }, (_, i) => overrides[i] ?? ALLOWED);

  it('accepts a triangle that is still free', () => {
    expect(isColoringAllowed(gridWith(), 0)).toBe(true);
    expect(isColoringAllowed(gridWith(), 15)).toBe(true);
  });

  it('refuses a triangle someone has already coloured', () => {
    expect(isColoringAllowed(gridWith({ 5: COLORED }), 5)).toBe(false);
  });

  it('refuses a triangle forbidden by a coloured neighbour', () => {
    // Colouring 5 forbids its side neighbours 1, 4 and 6.
    const afterColouring5 = gridWith({ 5: COLORED, 1: FORBIDDEN, 4: FORBIDDEN, 6: FORBIDDEN });
    expect(isColoringAllowed(afterColouring5, 1)).toBe(false);
    expect(isColoringAllowed(afterColouring5, 4)).toBe(false);
    expect(isColoringAllowed(afterColouring5, 6)).toBe(false);
    // A triangle that is not a neighbour stays free.
    expect(isColoringAllowed(afterColouring5, 15)).toBe(true);
  });

  it('refuses a triangle that is not on the board', () => {
    expect(isColoringAllowed(gridWith(), -1)).toBe(false);
    expect(isColoringAllowed(gridWith(), 16)).toBe(false);
    expect(isColoringAllowed(gridWith(), 1.5)).toBe(false);
  });
});

// Colouring a triangle forbids its side-neighbours, so the grid runs out; the
// player who colours the last available triangle wins.
describe('end of game', () => {
  it('ends exactly on the colouring that uses up the grid', () => {
    let board: Board = Array(16).fill(ALLOWED);
    let player = 0;
    let outcome = moves.colorTriangle.apply(board, asPlayer(player), allowedTriangles(board)[0]);

    while (allowedTriangles(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.colorTriangle.apply(board, asPlayer(player), allowedTriangles(board)[0]);
    }

    expect(allowedTriangles(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
