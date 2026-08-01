import { isRobbable, type Board } from './bank-robbers';

const board = (standing: boolean[]): Board => ({
  circle: standing,
  lastMove: null,
  firstMove: 0
});

describe('isRobbable', () => {
  it('accepts any standing bank while the circle is untouched', () => {
    const untouched = board(Array(7).fill(true));
    for (let i = 0; i < 7; i++) expect(isRobbable(untouched, i)).toBe(true);
  });

  it('refuses a bank that has already been robbed', () => {
    const b = board([true, false, true, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(false);
  });

  it('refuses a bank whose two neighbours are both gone — the police wait there', () => {
    const b = board([false, true, false, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(false);
    // Its own neighbours still standing, so this one is fine.
    expect(isRobbable(b, 4)).toBe(true);
  });

  it('accepts a bank with just one neighbour still standing', () => {
    const b = board([false, true, true, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(true);
  });

  it('treats the circle as a circle — index 0 and the last bank are neighbours', () => {
    const b = board([true, false, true, true, true, true, false]);
    // Bank 0's neighbours are 6 and 1, both robbed.
    expect(isRobbable(b, 0)).toBe(false);
  });

  it('refuses a bank that is not on the circle', () => {
    const b = board(Array(7).fill(true));
    expect(isRobbable(b, -1)).toBe(false);
    expect(isRobbable(b, 7)).toBe(false);
  });
});
