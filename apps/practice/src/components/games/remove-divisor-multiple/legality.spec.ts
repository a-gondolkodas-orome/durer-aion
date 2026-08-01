import { range } from 'lodash';
import { isAllowed } from './remove-divisor-multiple';

const board = (previousMove: number | null, removed: number[] = [], size = 10) => ({
  numbersOnTable: range(1, size + 1).map(n => !removed.includes(n)),
  previousMove
});

describe('isAllowed', () => {
  it('accepts any number on the table as the opening move', () => {
    expect(isAllowed(board(null), 1)).toBe(true);
    expect(isAllowed(board(null), 10)).toBe(true);
  });

  it('accepts divisors and multiples of the number just removed', () => {
    const after6 = board(6, [6]);
    expect(isAllowed(after6, 2)).toBe(true); // divisor
    expect(isAllowed(after6, 3)).toBe(true); // divisor
    expect(isAllowed(after6, 1)).toBe(true); // divisor
    expect(isAllowed(after6, 4)).toBe(false); // neither
    expect(isAllowed(after6, 5)).toBe(false); // neither
  });

  it('refuses a number that has already been removed', () => {
    expect(isAllowed(board(6, [6, 3]), 3)).toBe(false);
    expect(isAllowed(board(null, [4]), 4)).toBe(false);
  });

  it('refuses a number that is not on the board at all', () => {
    expect(isAllowed(board(null), 0)).toBe(false);
    expect(isAllowed(board(null), 11)).toBe(false);
    expect(isAllowed(board(null), 2.5)).toBe(false);
    expect(isAllowed(board(6, [6]), 12)).toBe(false);
  });
});
