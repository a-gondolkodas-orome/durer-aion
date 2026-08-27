import { describe, expect, it } from 'vitest';
import { parseTeamModelDto } from './dto';
import { TeamModelDto } from './dto';

const team: TeamModelDto = {
  teamId: '42',
  joinCode: 'abcdef',
  teamName: 'Vándorsólymok',
  category: 'C',
  credentials: 'secret',
  email: 'team@example.com',
  pageState: 'HOME',
  relayMatch: { state: 'NOT STARTED' },
  strategyMatch: {
    state: 'FINISHED',
    startAt: new Date('2026-08-27T10:00:00.000Z'),
    endAt: new Date('2026-08-27T10:30:00.000Z'),
    matchID: 'm-1',
    score: 12,
  },
};

// What the parser actually receives: the team after a JSON round trip, so
// with its Date fields flattened to ISO strings.
const wireTeam = (): unknown => JSON.parse(JSON.stringify(team));

describe('parseTeamModelDto', () => {
  it('accepts a JSON round trip of a valid team and revives its dates', () => {
    expect(parseTeamModelDto(wireTeam())).toEqual(team);
  });

  it('ignores extra fields the wire carries', () => {
    const wire = wireTeam() as Record<string, unknown>;
    wire.other = ' te[m-1]:5';
    wire.createdAt = '2026-08-01T00:00:00.000Z';
    expect(parseTeamModelDto(wire)).toEqual(team);
  });

  it('accepts an in-progress match without a score', () => {
    const wire = wireTeam() as Record<string, unknown>;
    wire.relayMatch = {
      state: 'IN PROGRESS',
      startAt: '2026-08-27T10:00:00.000Z',
      endAt: '2026-08-27T11:00:00.000Z',
      matchID: 'm-2',
    };
    expect(parseTeamModelDto(wire)?.relayMatch).toEqual({
      state: 'IN PROGRESS',
      startAt: new Date('2026-08-27T10:00:00.000Z'),
      endAt: new Date('2026-08-27T11:00:00.000Z'),
      matchID: 'm-2',
    });
  });

  it.each([
    ['not an object', 'a string'],
    ['null', null],
    ['a missing field', (() => { const wire = wireTeam() as Record<string, unknown>; delete wire.joinCode; return wire; })()],
    ['an unknown pageState', { ...(wireTeam() as Record<string, unknown>), pageState: 'LOBBY' }],
    ['an unknown match state', { ...(wireTeam() as Record<string, unknown>), relayMatch: { state: 'PAUSED' } }],
    ['an unparsable date', { ...(wireTeam() as Record<string, unknown>), strategyMatch: { state: 'FINISHED', startAt: 'not a date', endAt: '2026-08-27T10:30:00.000Z', matchID: 'm-1', score: 12 } }],
    ['a finished match without a score', { ...(wireTeam() as Record<string, unknown>), strategyMatch: { state: 'FINISHED', startAt: '2026-08-27T10:00:00.000Z', endAt: '2026-08-27T10:30:00.000Z', matchID: 'm-1' } }],
  ])('rejects %s', (_name, wire) => {
    expect(parseTeamModelDto(wire)).toBeNull();
  });
});
