import { isSubtractionAllowed } from './prime-exponentials';

describe('isSubtractionAllowed', () => {
  it('allows a prime power no larger than the number', () => {
    expect(isSubtractionAllowed(100, { prime: 7, exponent: 2 })).toBe(true); // 49
    expect(isSubtractionAllowed(100, { prime: 97, exponent: 1 })).toBe(true);
  });

  it('allows subtracting exactly the number itself', () => {
    expect(isSubtractionAllowed(49, { prime: 7, exponent: 2 })).toBe(true);
  });

  it('rejects a prime power larger than the number', () => {
    expect(isSubtractionAllowed(48, { prime: 7, exponent: 2 })).toBe(false);
  });

  it('allows 1, the single exponent-0 entry', () => {
    expect(isSubtractionAllowed(5, { prime: 2, exponent: 0 })).toBe(true);
    // 3^0 is also 1, but it is not one of the enumerated entries
    expect(isSubtractionAllowed(5, { prime: 3, exponent: 0 })).toBe(false);
  });

  it('rejects a composite base, which plain arithmetic would accept', () => {
    expect(isSubtractionAllowed(100, { prime: 6, exponent: 2 })).toBe(false); // 36
    expect(isSubtractionAllowed(100, { prime: 4, exponent: 1 })).toBe(false);
  });

  it('rejects a negative or non-integer exponent', () => {
    expect(isSubtractionAllowed(100, { prime: 7, exponent: -1 })).toBe(false);
    expect(isSubtractionAllowed(100, { prime: 7, exponent: 1.5 })).toBe(false);
  });
});
