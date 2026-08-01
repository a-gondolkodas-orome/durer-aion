import { isMoveValid } from './primely-to-zero';

describe('isMoveValid', () => {
  it('allows a target reached by subtracting 1, 2 or a prime', () => {
    expect(isMoveValid(50, 49)).toBe(true); // −1
    expect(isMoveValid(50, 48)).toBe(true); // −2
    expect(isMoveValid(50, 47)).toBe(true); // −3
    expect(isMoveValid(50, 3)).toBe(true); // −47
  });

  it('rejects a target reached by subtracting a composite', () => {
    expect(isMoveValid(50, 46)).toBe(false); // −4
    expect(isMoveValid(50, 44)).toBe(false); // −6
  });

  it('allows landing exactly on zero when the number itself is a valid step', () => {
    expect(isMoveValid(47, 0)).toBe(true);
    expect(isMoveValid(50, 0)).toBe(false); // 50 is not a valid step
  });

  it('rejects staying put or moving upwards', () => {
    expect(isMoveValid(50, 50)).toBe(false);
    expect(isMoveValid(50, 51)).toBe(false);
  });

  it('rejects a negative or non-integer target', () => {
    expect(isMoveValid(50, -1)).toBe(false);
    expect(isMoveValid(50, 47.5)).toBe(false);
  });
});
