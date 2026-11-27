import type { MatchStatus, PublicCompetition } from 'schemas';
import { roundsView } from './rounds-view';

const both: PublicCompetition = {
  id: 'aaaaaaaaaa--both',
  languages: ['hu'],
  relay: { durationMinutes: 60, problemPoints: [3] },
  strategy: { durationMinutes: 30, gameId: 'minta-sablon' },
  metadata: { kind: 'other', label: { hu: 'Mindkettő' } },
};
const notStarted: MatchStatus = { state: 'NOT STARTED' };
const finished: MatchStatus = { state: 'FINISHED', matchID: 'm', score: 12, startAt: new Date(), endAt: new Date() };
const team = { competition: both, relayMatch: notStarted, strategyMatch: finished };

test('on the strategy page, the other round is the relay', () => {
  expect(roundsView({ ...team, pageState: 'STRATEGY' })).toEqual({
    current: { type: 'strategy', status: finished },
    other: { type: 'relay', status: notStarted },
  });
});

test('on the relay page, the other round is the strategy match', () => {
  expect(roundsView({ ...team, pageState: 'RELAY' })).toEqual({
    current: { type: 'relay', status: notStarted },
    other: { type: 'strategy', status: finished },
  });
});

test.each(['HOME', 'DISCLAIMER'] as const)('says nothing on the %s page', pageState => {
  expect(roundsView({ ...team, pageState })).toBeUndefined();
});

test.each([
  ['a relay-only competition', { ...both, strategy: undefined }],
  ['a strategy-only competition', { ...both, relay: undefined }],
  ['no competition', undefined],
  ['a competition the server no longer has', null],
])('says nothing in %s', (_, competition) => {
  expect(roundsView({ ...team, competition, pageState: 'RELAY' })).toBeUndefined();
});

test('says nothing before the team is known', () => {
  expect(roundsView(null)).toBeUndefined();
});
