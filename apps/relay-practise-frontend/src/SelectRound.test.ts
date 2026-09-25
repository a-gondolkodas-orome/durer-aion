import { expect, it } from 'vitest';
import { Category, playableTests } from './SelectRound';

it('lists C+ years under E, keeping their real category', () => {
  expect(playableTests(Category.E, 'final')).toEqual([
    { yearIdx: 8, category: Category.Cp },
    { yearIdx: 9, category: Category.Cp },
    { yearIdx: 10, category: Category.Cp },
    { yearIdx: 11, category: Category.E },
  ]);
  expect(playableTests(Category.Cp, 'final')).toEqual([]);
});
