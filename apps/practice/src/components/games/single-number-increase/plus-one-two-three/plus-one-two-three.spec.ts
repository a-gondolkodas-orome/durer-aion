import { isIncreaseValid } from './plus-one-two-three';

describe('isIncreaseValid', () => {
  it('allows advancing by 1, 2 or 3', () => {
    expect([11, 12, 13].every(number => isIncreaseValid({ board: 10, number }))).toBe(true);
  });

  it('rejects advancing by more than 3', () => {
    expect(isIncreaseValid({ board: 10, number: 14 })).toBe(false);
  });

  it('rejects standing still or stepping backwards', () => {
    expect(isIncreaseValid({ board: 10, number: 10 })).toBe(false);
    expect(isIncreaseValid({ board: 10, number: 9 })).toBe(false);
  });

  it('allows stepping past the target, which is how a player loses', () => {
    expect(isIncreaseValid({ board: 40, number: 41 })).toBe(true);
  });

  it('rejects a non-integer target', () => {
    expect(isIncreaseValid({ board: 10, number: 11.5 })).toBe(false);
  });
});
