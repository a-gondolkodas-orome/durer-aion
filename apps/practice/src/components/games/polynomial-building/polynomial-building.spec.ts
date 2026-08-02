import { moves } from './polynomial-building';
import { hasThreeIntegerRoots, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// The game ends when the third coefficient of x³ + ax² + bx + c is fixed;
// player A wins iff all three roots are then integers.
const meta = { ctx: makeCtx() };

const board = (a: number | null, b: number | null, c: number | null): Board => ({ a, b, c });

describe('end of game', () => {
  it('gives the game to A when the finished polynomial has three integer roots', () => {
    // (x + 1)(x + 2)(x + 3) = x³ + 6x² + 11x + 6
    expect(hasThreeIntegerRoots(6, 11, 6)).toBe(true);
    const outcome = moves.setCoefficient.apply(board(6, 11, null), meta, 'c', 6);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to B otherwise', () => {
    // x³ + 1 has one integer root and two complex ones
    expect(hasThreeIntegerRoots(0, 0, 1)).toBe(false);
    const outcome = moves.setCoefficient.apply(board(0, 0, null), meta, 'c', 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while a coefficient is still open', () => {
    const outcome = moves.setCoefficient.apply(board(null, null, null), meta, 'a', 6);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
