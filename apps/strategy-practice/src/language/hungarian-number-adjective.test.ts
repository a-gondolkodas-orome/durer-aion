import { hungarianNumberAdjective } from './hungarian-number-adjective';

describe('hungarianNumberAdjective', () => {
  it.each([
    [1, '1-es'], [2, '2-es'], [3, '3-as'], [4, '4-es'], [5, '5-ös'],
    [6, '6-os'], [7, '7-es'], [8, '8-as'], [9, '9-es'], [0, '0-ás']
  ])('follows the last digit: %i → %s', (n, expected) => {
    expect(hungarianNumberAdjective(n)).toBe(expected);
  });

  it.each([
    [10, '10-es'], [20, '20-as'], [30, '30-as'], [40, '40-es'], [50, '50-es'],
    [60, '60-as'], [70, '70-es'], [80, '80-as'], [90, '90-es']
  ])('follows the tens word for a round number: %i → %s', (n, expected) => {
    expect(hungarianNumberAdjective(n)).toBe(expected);
  });

  it('follows the last non-zero place', () => {
    expect(hungarianNumberAdjective(16)).toBe('16-os');
    expect(hungarianNumberAdjective(120)).toBe('120-as');
    expect(hungarianNumberAdjective(100)).toBe('100-as');
    expect(hungarianNumberAdjective(2000)).toBe('2000-es');
    expect(hungarianNumberAdjective(1_000_000)).toBe('1000000-os');
  });
});
