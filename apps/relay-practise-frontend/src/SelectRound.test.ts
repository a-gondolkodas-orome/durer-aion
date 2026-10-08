import { expect, it } from 'vitest';
import { Category, parseRelayTestCode, playableTests, relayTestCode } from './SelectRound';

it('lists C+ years under E, keeping their real category', () => {
  expect(playableTests(Category.E, 'final')).toEqual([
    { yearIdx: 8, category: Category.Cp },
    { yearIdx: 9, category: Category.Cp },
    { yearIdx: 10, category: Category.Cp },
    { yearIdx: 11, category: Category.E },
  ]);
  expect(playableTests(Category.Cp, 'final')).toEqual([]);
});

it('parses a test code back into its parts', () => {
  expect(parseRelayTestCode(relayTestCode(11, 'final', Category.Cp))).toEqual({ year: 12, round: 'final', category: 'C+' });
  expect(parseRelayTestCode(relayTestCode(18, 'online', Category.E))).toEqual({ year: 19, round: 'online', category: 'E' });
  expect(parseRelayTestCode(relayTestCode(8, 'local', Category.A))).toEqual({ year: 9, round: 'local', category: 'A' });
});
