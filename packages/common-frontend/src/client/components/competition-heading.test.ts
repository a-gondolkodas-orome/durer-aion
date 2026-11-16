import type { TFunction } from 'i18next';
import type { PublicCompetition } from 'schemas';
import { competitionHeading, romanNumeral } from './competition-heading';

// The key, with what was filled in, so a test sees both.
const t = ((key: string, options?: object) => options ? `${key} ${JSON.stringify(options)}` : key) as TFunction;

const competition = (metadata: PublicCompetition['metadata']): PublicCompetition =>
  ({ id: 'aaaaaaaaaa--x', languages: ['hu', 'en'], metadata });

test.each([[1, 'I'], [4, 'IV'], [9, 'IX'], [14, 'XIV'], [19, 'XIX'], [20, 'XX'], [40, 'XL']])(
  'writes %i as %s', (value, numeral) => {
    expect(romanNumeral(value)).toBe(numeral);
  });

test('names a round of the Dürer by its edition and round', () => {
  expect(competitionHeading(competition({ kind: 'competition', edition: 21, round: 'final', category: 'E+' }), 'hu', t))
    .toStrictEqual({ title: 'header.titleOfEdition {"edition":"XXI"}', subtitle: 'header.round.final' });
});

test('names anything else by its label, in the team\'s language', () => {
  const practice = competition({ kind: 'other', label: { hu: 'Algebra', en: 'Algebra in English' } });
  expect(competitionHeading(practice, 'en', t))
    .toStrictEqual({ title: 'header.titlePlain', subtitle: 'Algebra in English' });
});

test('names no edition before login, nor for a competition the server no longer has', () => {
  const plain = { title: 'header.titlePlain', subtitle: 'header.subtitle' };
  expect(competitionHeading(undefined, 'hu', t)).toStrictEqual(plain);
  expect(competitionHeading(null, 'hu', t)).toStrictEqual(plain);
});
