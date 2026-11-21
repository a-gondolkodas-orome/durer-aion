import type { PublicCompetition } from 'schemas';
import { competingEnd, maxPoints, relayNumbers, strategyMinutes } from './round-numbers';

const competition: PublicCompetition = {
  id: 'aaaaaaaaaa--short',
  languages: ['hu'],
  relay: { durationMinutes: 45, problemPoints: [2, 5, 3] },
  strategy: { durationMinutes: 20 },
  metadata: { kind: 'other', label: { hu: 'Rövid' } },
};

test("tells the team's competition's relay", () => {
  expect(relayNumbers(competition)).toEqual({ minutes: 45, total: 10, min: 2, max: 5 });
});

test("tells the team's competition's strategy match", () => {
  expect(strategyMinutes(competition)).toBe(20);
});

// The local apps serve no competition.
test('tells the online round as it is without a competition', () => {
  expect(relayNumbers(undefined)).toEqual({ minutes: 60, total: 40, min: 3, max: 6 });
  expect(relayNumbers(null)).toEqual({ minutes: 60, total: 40, min: 3, max: 6 });
  expect(strategyMinutes(undefined)).toBe(30);
});

test('adds the best strategy result to the relay, of the matches there are', () => {
  expect(maxPoints(competition)).toBe(22);
  expect(maxPoints({ ...competition, strategy: undefined })).toBe(10);
  expect(maxPoints({ ...competition, relay: undefined })).toBe(12);
});

// A match started just before the close runs its full time.
test('ends the competing time the longer match after the window closes', () => {
  const startWindow = { opensAt: '2026-10-20T15:00:00+02:00', closesAt: '2026-10-20T20:00:00+02:00' };
  expect(competingEnd(startWindow, competition)).toEqual(new Date('2026-10-20T20:45:00+02:00'));
  expect(competingEnd({ opensAt: startWindow.opensAt }, competition)).toBeUndefined();
  expect(competingEnd(null, competition)).toBeUndefined();
});
