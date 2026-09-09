import { moves } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isSubtractableDigit = moveValidator(moves.subtractDigit);

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('isSubtractableDigit', () => {
  it('accepts a digit that appears in the current number', () => {
    expect(isSubtractableDigit(147, 1)).toBe(true);
    expect(isSubtractableDigit(147, 4)).toBe(true);
    expect(isSubtractableDigit(147, 7)).toBe(true);
  });

  it('refuses a digit the number does not contain', () => {
    expect(isSubtractableDigit(147, 2)).toBe(false);
    expect(isSubtractableDigit(147, 9)).toBe(false);
  });

  it('refuses zero — subtracting it would never end the game', () => {
    expect(isSubtractableDigit(105, 0)).toBe(false);
  });

  it('refuses anything that is not a single digit', () => {
    expect(isSubtractableDigit(147, 14)).toBe(false);
    expect(isSubtractableDigit(147, -1)).toBe(false);
    expect(isSubtractableDigit(147, 1.5)).toBe(false);
  });

  it('counts a repeated digit once, and accepts it', () => {
    expect(isSubtractableDigit(11, 1)).toBe(true);
  });
});

// Players subtract one of the number's own non-zero digits; whoever reaches
// zero wins.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on reaching zero', player => {
    const outcome = moves.subtractDigit.apply(7, asPlayer(player), 7);
    expect(outcome.nextBoard).toBe(0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while the number stays positive', () => {
    const outcome = moves.subtractDigit.apply(27, asPlayer(0), 7);
    expect(outcome.nextBoard).toBe(20);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
