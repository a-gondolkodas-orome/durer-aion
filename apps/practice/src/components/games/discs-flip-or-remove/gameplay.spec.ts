import { describe, it, expect } from 'vitest';
import { moves } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isRemovalAllowed = moveValidator(moves.removeDiscs);
const isFlipAllowed = moveValidator(moves.turnDiscs);

describe('isRemovalAllowed', () => {
  it('accepts taking one or two blue discs', () => {
    expect(isRemovalAllowed([3, 4], 1)).toBe(true);
    expect(isRemovalAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses any other count', () => {
    expect(isRemovalAllowed([3, 4], 0)).toBe(false);
    expect(isRemovalAllowed([3, 4], 3)).toBe(false);
    expect(isRemovalAllowed([3, 4], -1)).toBe(false);
  });

  it('refuses taking more blue discs than there are', () => {
    expect(isRemovalAllowed([1, 4], 2)).toBe(false);
    expect(isRemovalAllowed([1, 4], 1)).toBe(true);
    expect(isRemovalAllowed([0, 4], 1)).toBe(false);
  });
});

describe('isFlipAllowed', () => {
  it('accepts flipping one or two red discs', () => {
    expect(isFlipAllowed([3, 4], 1)).toBe(true);
    expect(isFlipAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses flipping more red discs than there are', () => {
    expect(isFlipAllowed([3, 1], 2)).toBe(false);
    expect(isFlipAllowed([3, 1], 1)).toBe(true);
    expect(isFlipAllowed([3, 0], 1)).toBe(false);
  });

  it('counts each pile separately — a full blue pile does not license a red flip', () => {
    expect(isFlipAllowed([9, 0], 1)).toBe(false);
    expect(isRemovalAllowed([0, 9], 1)).toBe(false);
  });
});

// A move takes discs off the blue pile or moves them across from the red one,
// so the board empties only through a removal; the player left with [0, 0]
// cannot move and loses.
describe('move outcomes', () => {
  const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

  it('takes the discs off the table when the blue pile is drawn from', () => {
    expect(moves.removeDiscs.apply([3, 4], asPlayer(0), 2).nextBoard).toEqual([1, 4]);
  });

  it('moves flipped discs from red to blue rather than discarding them', () => {
    expect(moves.turnDiscs.apply([3, 4], asPlayer(0), 2).nextBoard).toEqual([5, 2]);
  });

  it.each([0, 1])('ends for the mover (player %i) on clearing the table', player => {
    const outcome = moves.removeDiscs.apply([2, 0], asPlayer(player), 2);
    expect(outcome.nextBoard).toEqual([0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while any disc is left', () => {
    const outcome = moves.removeDiscs.apply([2, 1], asPlayer(0), 2);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a flip — it always leaves a blue disc behind', () => {
    const outcome = moves.turnDiscs.apply([0, 1], asPlayer(0), 1);
    expect(outcome.nextBoard).toEqual([1, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
