import { isRemovalAllowed } from './stones-remove-one-not-twice-from-left';

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
