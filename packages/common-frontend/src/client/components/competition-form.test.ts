import type { CompetitionConfig, Language } from 'schemas';
import { competitionFromForm, settingsForm } from './competition-form';

const ID = 'aqvco71pta--csomag-teljes';
const full: CompetitionConfig = {
  id: ID,
  languages: ['hu', 'en'],
  startWindow: { opensAt: '2027-11-02T14:00+01:00', closesAt: '2027-11-02T18:00+01:00' },
  relay: { durationMinutes: 60, problems: [{ problemId: 'roow9oo75t--csomag-paros', points: 3 }] },
  strategy: { durationMinutes: 30, gameId: 'minta-ketkupac' },
  advancingPoints: 25,
  finishMessage: { hu: 'Köszönjük!' },
  metadata: { kind: 'competition', edition: 21, round: 'online', category: 'C', label: { hu: 'pótforduló' } },
};

const roundTrip = (competition: CompetitionConfig) => competitionFromForm(settingsForm(competition), competition);

test.each([
  ['a full competition', full],
  ['a practice set with a relay alone and nothing optional', {
    id: ID, languages: ['en'], relay: full.relay, metadata: { kind: 'other', label: { en: 'Practice' } },
  } satisfies CompetitionConfig],
  ['a window with no close', { ...full, startWindow: { opensAt: '2027-11-02T14:00+01:00' } }],
])('the form gives back %s unchanged', (_, competition) => {
  expect(roundTrip(competition)).toEqual({ competition });
});

test('keeps the relay\'s problems and the id, which the form does not edit', () => {
  const form = { ...settingsForm(full), relayMinutes: '45' };
  expect(competitionFromForm(form, full)).toEqual({
    competition: { ...full, relay: { durationMinutes: 45, problems: full.relay?.problems } },
  });
});

test('leaves out what is turned off or left empty, and lists the languages in the platform\'s order', () => {
  const form = {
    ...settingsForm(full),
    languages: ['en', 'hu'] satisfies Language[],
    hasStrategy: false, opensAt: '', closesAt: ' ', advancingPoints: '', finishMessage: { hu: ' ', en: '' },
    label: { hu: '', en: '' },
  };
  const { id, languages, relay } = full;
  expect(competitionFromForm(form, full)).toEqual({
    competition: { id, languages, relay, metadata: { kind: 'competition', edition: 21, round: 'online', category: 'C' } },
  });
});

test('a relay turned on where there was none starts with no problems, for the validator to refuse', () => {
  const noRelay = { ...full, relay: undefined };
  const form = { ...settingsForm(noRelay), hasRelay: true, relayMinutes: '60' };
  expect(competitionFromForm(form, noRelay)).toMatchObject({ competition: { relay: { durationMinutes: 60, problems: [] } } });
});

test('names each number field that holds no whole number, and checks only the ones in use', () => {
  const form = { ...settingsForm(full), edition: 'huszonegy', relayMinutes: '1.5', strategyMinutes: '', advancingPoints: 'x' };
  expect(competitionFromForm(form, full)).toEqual({ fieldErrors: {
    edition: 'Egész számot írj ide.', relayMinutes: 'Egész számot írj ide.',
    strategyMinutes: 'Egész számot írj ide.', advancingPoints: 'Egész számot írj ide.',
  } });
  expect(competitionFromForm({ ...form, kind: 'other', hasRelay: false, hasStrategy: false, advancingPoints: '' }, full))
    .not.toHaveProperty('fieldErrors');
});

test('sends a practice set an empty label where it has none, for the validator to name', () => {
  const form = { ...settingsForm(full), kind: 'other' as const, label: { hu: '', en: '' } };
  expect(competitionFromForm(form, full)).toMatchObject({ competition: { metadata: { kind: 'other', label: {} } } });
});
