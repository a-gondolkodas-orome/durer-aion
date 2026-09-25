import { describe, expect, it } from 'vitest';
import { availableRelayTests, Category, listedAs, playableTests, relayTestCode, RoundType } from './SelectRound';
import { hasProblemSet } from './problems';

const roundTypes: RoundType[] = ['local', 'final', 'online'];

describe('listedAs', () => {
  it('lists C+ under E and D+ under E+, every other category under itself', () => {
    expect(listedAs(Category.Cp)).toBe(Category.E);
    expect(listedAs(Category.Dp)).toBe(Category.Ep);
    for (const cat of [Category.A, Category.B, Category.C, Category.D, Category.E, Category.Ep]) {
      expect(listedAs(cat)).toBe(cat);
    }
  });
});

describe('playableTests', () => {
  it('offers every bundled test exactly once, under its listed category', () => {
    const offered = roundTypes.flatMap(round =>
      Object.values(Category).flatMap(listed =>
        playableTests(listed, round).map(({ yearIdx, category }) => relayTestCode(yearIdx, round, category))
      )
    );
    const bundled = roundTypes.flatMap(round =>
      availableRelayTests.flatMap((test, yearIdx) =>
        (test[round] ?? []).map(cat => relayTestCode(yearIdx, round, cat))
      )
    ).filter(hasProblemSet);

    expect(offered.sort()).toEqual(bundled.sort());
  });

  it('keeps the real category of a C+ year listed under E', () => {
    expect(playableTests(Category.E, 'final')).toContainEqual({ yearIdx: 8, category: Category.Cp });
    expect(playableTests(Category.Cp, 'final')).toEqual([]);
  });

  it('offers at most one test per year', () => {
    for (const round of roundTypes) {
      for (const listed of Object.values(Category)) {
        const years = playableTests(listed, round).map(({ yearIdx }) => yearIdx);
        expect(new Set(years).size).toBe(years.length);
      }
    }
  });
});
