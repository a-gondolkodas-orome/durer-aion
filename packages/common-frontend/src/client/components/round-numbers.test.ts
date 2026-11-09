import type { PublicCompetition } from 'schemas';
import { relayNumbers, strategyMinutes } from './round-numbers';

const competition: PublicCompetition = {
  id: 'aaaaaaaaaa--short',
  languages: ['hu'],
  relay: { durationMinutes: 45, problemPoints: [2, 5, 3] },
  strategy: { durationMinutes: 20, gameId: '20o-e' },
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
