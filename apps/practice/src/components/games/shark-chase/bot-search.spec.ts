import { preferenceRings } from './bot-search';

// Both lakes used to carry their preference order as a literal list, one per
// bot. They are not arbitrary: each is the sectors grouped by distance from the
// centre, which is what `preferenceRings` derives. These are the two lists as
// they were written, so a change to the derivation has to answer for them.
describe('preferenceRings', () => {
  it('is the middle of the 4 × 4 lake, then its edges, then its corners', () => {
    expect(preferenceRings(4)).toEqual([
      [5, 6, 9, 10],
      [1, 2, 4, 7, 8, 11, 13, 14],
      [0, 3, 12, 15]
    ]);
  });

  it('works out from the centre sector of the 5 × 5 lake', () => {
    expect(preferenceRings(5)).toEqual([
      [12],
      [7, 11, 13, 17],
      // Two steps out diagonally comes before two steps out in a straight line
      [6, 8, 16, 18],
      [2, 10, 14, 22],
      [1, 3, 5, 9, 15, 19, 21, 23],
      [0, 4, 20, 24]
    ]);
  });

  it('covers every sector exactly once', () => {
    for (const size of [4, 5]) {
      expect(preferenceRings(size).flat().sort((a, b) => a - b))
        .toEqual(Array.from({ length: size * size }, (_, i) => i));
    }
  });
});
