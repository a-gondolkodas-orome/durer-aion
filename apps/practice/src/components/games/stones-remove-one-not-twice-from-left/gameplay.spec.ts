import { isRemovalAllowed, moves } from './gameplay';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (piles: [number, number], leftRestriction: [boolean, boolean] = [false, false]) =>
  ({ piles, leftRestriction });

describe('isRemovalAllowed', () => {
  it('accepts either pile when nobody is restricted', () => {
    const b = board([3, 4]);
    expect(isRemovalAllowed(b, 0, 0)).toBe(true);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
  });

  it('refuses an empty pile', () => {
    expect(isRemovalAllowed(board([0, 4]), 0, 0)).toBe(false);
    expect(isRemovalAllowed(board([3, 0]), 0, 1)).toBe(false);
  });

  it('closes the left pile to a player who took from it last turn', () => {
    const b = board([3, 4], [true, false]);
    expect(isRemovalAllowed(b, 0, 0)).toBe(false);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
  });

  it('restricts only the player who took from the left, not the other one', () => {
    const b = board([3, 4], [true, false]);
    expect(isRemovalAllowed(b, 1, 0)).toBe(true);
  });

  it('never restricts the right pile', () => {
    const b = board([3, 4], [true, true]);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
    expect(isRemovalAllowed(b, 1, 1)).toBe(true);
  });

  it('refuses a pile that does not exist', () => {
    const b = board([3, 4]);
    expect(isRemovalAllowed(b, 0, 2)).toBe(false);
    expect(isRemovalAllowed(b, 0, -1)).toBe(false);
  });
});

// The game ends when both piles are empty, or when the right pile is empty and
// the player about to move may not take from the left one (they took from it
// last time).
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on the last stone', p => {
    const outcome = moves.removeStone.apply(board([0, 1]), asPlayer(p), 1);
    expect(outcome.nextBoard.piles).toEqual([0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends when the right pile empties and the opponent is barred from the left', () => {
    // player 1 took from the left last time, so with the right pile gone they are stuck
    const outcome = moves.removeStone.apply(board([1, 1], [false, true]), asPlayer(0), 1);
    expect(outcome.nextBoard.piles).toEqual([1, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn when the opponent may still take from the left', () => {
    const outcome = moves.removeStone.apply(board([1, 1], [false, false]), asPlayer(0), 1);
    expect(outcome.nextBoard.piles).toEqual([1, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('records that the mover just took from the left pile', () => {
    const outcome = moves.removeStone.apply(board([2, 2]), asPlayer(1), 0);
    expect(outcome.nextBoard.leftRestriction).toEqual([false, true]);
    expect(outcome.isTurnEnd).toBe(true);
  });
});
