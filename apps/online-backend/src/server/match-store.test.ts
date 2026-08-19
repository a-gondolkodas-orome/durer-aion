import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Op } from 'sequelize';
import { applyEvent, createCompetitionMatchState } from 'competition';
import type { CompetitionEvent, CompetitionMatchState } from 'competition';
import type { Gameplay } from 'engine';
import { MatchesRepository, MatchModel, MatchEventModel, AppendableEvent } from './match-store';

// The SQL layer is faked with in-memory rows — CI has no Postgres — but the
// repository code and applyEvent are the real ones, so what the suite pins is
// the write discipline: versions guard writes, seq stays consecutive, and the
// stored snapshot is always the fold of the stored events.

interface MatchRow {
  matchId: string; teamId: string; kind: string; gameId: string; state: unknown; version: number;
}
type EventRow = AppendableEvent & { matchId: string; seq: number };

let matchRows: MatchRow[] = [];
let eventRows: EventRow[] = [];

const fakePostgresStore = {
  sequelize: { transaction: (callback: (t: unknown) => unknown) => callback({}) },
} as any;

const makeRepository = () => {
  vi.spyOn(MatchModel, 'init').mockReturnValue(MatchModel as any);
  vi.spyOn(MatchEventModel, 'init').mockReturnValue(MatchEventModel as any);
  vi.spyOn(MatchModel, 'create').mockImplementation(async (values: any) => {
    matchRows.push({ ...values });
    return values;
  });
  vi.spyOn(MatchModel, 'findOne').mockImplementation(async (options: any) =>
    (matchRows.find(row => row.matchId === options.where.matchId) ?? null) as any);
  vi.spyOn(MatchModel, 'update').mockImplementation(async (values: any, options: any) => {
    const row = matchRows.find(candidate =>
      candidate.matchId === options.where.matchId && candidate.version === options.where.version);
    if (!row) return [0] as any;
    Object.assign(row, values);
    return [1] as any;
  });
  vi.spyOn(MatchEventModel, 'max').mockImplementation(async (_field: any, options: any) => {
    const seqs = eventRows.filter(row => row.matchId === options.where.matchId).map(row => row.seq);
    return (seqs.length ? Math.max(...seqs) : null) as any;
  });
  vi.spyOn(MatchEventModel, 'bulkCreate').mockImplementation(async (records: any) => {
    eventRows.push(...records);
    return records;
  });
  vi.spyOn(MatchEventModel, 'findAll').mockImplementation(async (options: any) =>
    eventRows
      .filter(row => row.matchId === options.where.matchId && row.seq > options.where.seq[Op.gt])
      .sort((a, b) => a.seq - b.seq) as any);
  return new MatchesRepository(fakePostgresStore);
};

beforeEach(() => {
  vi.restoreAllMocks();
  matchRows = [];
  eventRows = [];
});

describe('MatchesRepository', () => {
  it('creates a match at version 0', async () => {
    const repository = makeRepository();
    await repository.createMatch({
      matchId: 'm1', teamId: 't1', kind: 'STRATEGY', gameId: 'G', state: { fresh: true },
    });
    expect(await repository.getMatch('m1')).toMatchObject({ state: { fresh: true }, version: 0 });
  });

  it('appends events with consecutive seq across writes and bumps the version', async () => {
    const repository = makeRepository();
    await repository.createMatch({ matchId: 'm1', teamId: 't1', kind: 'STRATEGY', gameId: 'G', state: {} });

    const first = await repository.appendEvents({
      matchId: 'm1', knownVersion: 0, state: { step: 1 },
      events: [
        { actor: 'team', type: 'START_ATTEMPT', payload: { n: 0 } },
        { actor: 'team', type: 'CHOOSE_ROLE', payload: { n: 1 } },
      ],
    });
    const second = await repository.appendEvents({
      matchId: 'm1', knownVersion: 1, state: { step: 2 },
      events: [{ actor: 'bot', type: 'MOVE', payload: { n: 2 } }],
    });

    expect(first).toEqual({ ok: true, version: 1 });
    expect(second).toEqual({ ok: true, version: 2 });
    expect(eventRows.map(row => row.seq)).toEqual([0, 1, 2]);
    expect(await repository.getMatch('m1')).toMatchObject({ state: { step: 2 }, version: 2 });
  });

  it('a stale version is a conflict: nothing is written', async () => {
    const repository = makeRepository();
    await repository.createMatch({ matchId: 'm1', teamId: 't1', kind: 'STRATEGY', gameId: 'G', state: { v: 0 } });
    await repository.appendEvents({
      matchId: 'm1', knownVersion: 0, state: { v: 1 },
      events: [{ actor: 'team', type: 'START_ATTEMPT', payload: {} }],
    });

    // A second tab still holding version 0 loses the race.
    const stale = await repository.appendEvents({
      matchId: 'm1', knownVersion: 0, state: { v: 'stale' },
      events: [{ actor: 'team', type: 'START_ATTEMPT', payload: { stale: true } }],
    });

    expect(stale).toEqual({ ok: false, conflict: true });
    expect(eventRows).toHaveLength(1);
    expect(await repository.getMatch('m1')).toMatchObject({ state: { v: 1 }, version: 1 });
  });

  it('eventsSince hands out only what the client lacks, in order', async () => {
    const repository = makeRepository();
    await repository.createMatch({ matchId: 'm1', teamId: 't1', kind: 'STRATEGY', gameId: 'G', state: {} });
    await repository.appendEvents({
      matchId: 'm1', knownVersion: 0, state: {},
      events: [0, 1, 2, 3].map(n => ({ actor: 'team' as const, type: 'MOVE', payload: { n } })),
    });

    const since = await repository.eventsSince('m1', 1);
    expect(since.map(row => [row.seq, (row.payload as { n: number }).n])).toEqual([[2, 2], [3, 3]]);
  });
});

// The plan's replay discipline (PR 3.1): the snapshot column is never anything
// but the fold of the event log. Played out the way a route will — read state
// and version, applyEvent, persist the accepted events with the state they
// fold to — then verified by replaying the *stored* rows from the initial
// state and comparing to the *stored* snapshot.
describe('the stored snapshot is the fold of the stored events', () => {
  interface Board { moved: number }

  const gameplay: Gameplay<Board> = {
    moves: {
      pass: { apply: (board) => ({ nextBoard: { moved: board.moved + 1 }, isTurnEnd: true }) },
      resolve: {
        apply: (board, _: unknown, winnerIndex: number) => ({ nextBoard: board, gameEnd: { winnerIndex } }),
      },
    },
  };
  const START_AT = '2026-02-01T10:00:00.000Z';

  it('replaying the log reproduces the persisted state', async () => {
    const repository = makeRepository();
    const initial = createCompetitionMatchState<Board>({ gameId: 'G', category: 'C', startAt: START_AT });
    await repository.createMatch({
      matchId: 'm1', teamId: 't1', kind: 'STRATEGY', gameId: 'G', state: initial,
    });

    // One request = one write: the team's event (and, after a team move, the
    // bot's reply events) land together with the state they fold to.
    const requests: { actor: 'team' | 'bot'; event: CompetitionEvent<Board> }[][] = [
      [{ actor: 'team', event: { type: 'START_ATTEMPT', at: START_AT, difficulty: 'live', board: { moved: 0 } } }],
      [{ actor: 'team', event: { type: 'CHOOSE_ROLE', at: START_AT, roleIndex: 0 } }],
      [
        { actor: 'team', event: { type: 'MOVE', at: START_AT, actor: 'team', name: 'pass', args: [] } },
        { actor: 'bot', event: { type: 'MOVE', at: START_AT, actor: 'bot', name: 'pass', args: [] } },
      ],
      [{ actor: 'team', event: { type: 'MOVE', at: START_AT, actor: 'team', name: 'resolve', args: [0] } }],
    ];

    for (const request of requests) {
      const match = await repository.getMatch('m1');
      if (!match) throw new Error('match row went missing');
      let state = match.state as CompetitionMatchState<Board>;
      for (const { event } of request) {
        const result = applyEvent(state, event, gameplay);
        if (!result.ok) throw new Error(`event rejected: ${result.rejection}`);
        state = result.state;
      }
      const appended = await repository.appendEvents({
        matchId: 'm1', knownVersion: match.version, state,
        events: request.map(({ actor, event }) => ({ actor, type: event.type, payload: event })),
      });
      expect(appended).toMatchObject({ ok: true });
    }

    const storedEvents = await repository.eventsSince('m1', -1);
    const replayed = storedEvents.reduce((state, row) => {
      const result = applyEvent(state, row.payload as CompetitionEvent<Board>, gameplay);
      if (!result.ok) throw new Error(`stored event ${row.seq} no longer applies: ${result.rejection}`);
      return result.state;
    }, initial);

    const stored = await repository.getMatch('m1');
    if (!stored) throw new Error('match row went missing');
    expect(replayed).toEqual(stored.state);
    expect((stored.state as CompetitionMatchState<Board>).tally.streak).toBe(1);
  });
});
