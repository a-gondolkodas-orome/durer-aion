import { menuCategories, menuEditions, menuRounds, otherSets, pastRounds } from './menu';
import { practiceSets } from './practice-sets';

const past = (id: string, edition: number, round: 'local' | 'final' | 'online', category: string) =>
  ({ id, metadata: { kind: 'competition' as const, edition, round, category } });
const sets = [
  past('e12', 12, 'final', 'E'),
  past('cp9', 9, 'final', 'C+'),
  past('b9h', 9, 'local', 'B'),
  past('b9d', 9, 'final', 'B'),
  { id: 'alg', metadata: { kind: 'other' as const, label: { hu: 'Algebra', en: 'Algebra' } } },
  { id: 'geo', metadata: { kind: 'other' as const, label: { hu: 'Geometria' } } },
];
const rounds = pastRounds(sets);

it('lists categories in the usual order, C+ and D+ under E and E+', () => {
  expect(menuCategories(rounds)).toEqual(['B', 'E']);
  expect(menuCategories(pastRounds(practiceSets))).toEqual(['A', 'B', 'C', 'D', 'E', 'E+']);
});

it('lists the rounds a category has, local first', () => {
  expect(menuRounds(rounds, 'B')).toEqual(['local', 'final']);
  expect(menuRounds(rounds, 'E')).toEqual(['final']);
});

it('lists C+ editions under E by edition, keeping their real category', () => {
  expect(menuEditions(rounds, 'E', 'final')).toEqual([
    { id: 'cp9', edition: 9, round: 'final', category: 'C+' },
    { id: 'e12', edition: 12, round: 'final', category: 'E' },
  ]);
});

it('lists other sets by their label, in another language where one is missing', () => {
  expect(otherSets(sets, 'en')).toEqual([{ id: 'alg', label: 'Algebra' }, { id: 'geo', label: 'Geometria' }]);
});
