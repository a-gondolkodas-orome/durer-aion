import { copyEntry, move, newEntry, pickedEntries, relayForm, relayFromForm } from './relay-form';

const relay = { durationMinutes: 30, problems: [{ problemId: 'aaaaaaaaaa--egy', points: 3 }, { problemId: 'bbbbbbbbbb--ketto', points: 4 }] };

test('reads the relay back unchanged', () => {
  expect(relayFromForm(relayForm(relay))).toEqual({ problems: relay.problems, created: [] });
});

test('moves an entry, and leaves the ends where they are', () => {
  expect(move(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  expect(move(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
  expect(move(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  expect(move(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
});

test('names a new problem by its slug after the random part, which stays', () => {
  const entry = newEntry('2', 'cccccccccc');
  if (entry.created === undefined) throw new Error('A new entry creates a problem');
  const filled = { ...entry, created: { ...entry.created, slug: ' harom ',
    problem: { answer: '7', content: { hu: { problemText: 'Mennyi?', imageUrl: '' }, en: { problemText: '', imageUrl: '' } } } } };
  expect(relayFromForm([filled])).toEqual({
    problems: [{ problemId: 'cccccccccc--harom', points: 2 }],
    created: [{ id: 'cccccccccc--harom', answer: 7, content: { hu: { problemText: 'Mennyi?' } } }],
  });
});

test('copies a problem whole, hints included, under a new id with the same slug', () => {
  const problem = { id: 'aaaaaaaaaa--egy', answer: 5, content: { en: { problemText: 'How many?', help2: 'Count.' } } };
  const [entry] = relayForm(relay);
  expect(relayFromForm([copyEntry(entry, problem, 'dddddddddd')])).toEqual({
    problems: [{ problemId: 'dddddddddd--egy', points: 3 }],
    created: [{ ...problem, id: 'dddddddddd--egy' }],
  });
});

test('names what of each entry it cannot read', () => {
  const [held] = relayForm(relay);
  const created = newEntry('x', 'eeeeeeeeee');
  expect(relayFromForm([{ ...held, points: '3.5' }, created])).toEqual({ errors: {
    [held.key]: { points: 'Egész számot írj ide.' },
    [created.key]: {
      points: 'Egész számot írj ide.',
      slug: 'Kisbetűk és számok, a szavak között egy-egy kötőjel, ékezet nélkül.',
      answer: 'Egész számot írj ide.',
    },
  } });
});

test('adds picked problems by their id, at the end, nothing to create', () => {
  const picked = { problem: { id: 'cccccccccc--harom', answer: 3, content: { hu: { problemText: 'Mennyi?' } } },
    storedIn: 'database' as const, uses: [] };
  expect(relayFromForm([...relayForm(relay), ...pickedEntries([picked], '5')])).toEqual({
    problems: [...relay.problems, { problemId: 'cccccccccc--harom', points: 5 }], created: [],
  });
});
