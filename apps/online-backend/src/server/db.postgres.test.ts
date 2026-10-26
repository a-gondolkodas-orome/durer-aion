import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import type { TeamsRepository } from './db';
import { startTestDatabase } from './test_database';
import { TeamModel } from './model';
import { adminTeamViews } from './match_status';

// TeamsRepository against a real postgres (test_database.ts), for what only the
// database decides: the unique constraints and the LIKE escape.

let database: Awaited<ReturnType<typeof startTestDatabase>>;

beforeAll(async () => {
  database = await startTestDatabase();
}, 30_000);

afterAll(async () => {
  await database?.stop();
});

beforeEach(async () => {
  await database.reset();
});

let teamNumber = 0;
/** A valid team, unique on every constrained column unless told otherwise. */
function team(overrides: Partial<Parameters<TeamsRepository['insertTeam']>[0]> = {}) {
  const n = String(++teamNumber).padStart(3, '0');
  return {
    teamname: `Team ${n}`,
    category: 'C',
    email: 'team@example.com',
    other: '',
    teamId: `8eae8669-125c-42e5-8b49-89afbac31${n}`,
    joinCode: `111-2222-${n}`,
    credentials: `67676767-6767-4767-a767-676767676${n}`,
    ...overrides,
  };
}

describe('the unique constraints sync() creates', () => {
  it.each([
    ['teamId', 'TeamId already exists.'],
    ['joinCode', 'JoinCode already exists.'],
    ['teamname', 'Teamname already exists.'],
    ['credentials', 'Credentials already exist.'],
  ] as const)('refuse a second team with the same %s', async (field, message) => {
    const first = team();
    await database.teams.insertTeam(first);

    // The message is model.ts's.
    await expect(database.teams.insertTeam(team({ [field]: first[field] })))
      .rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError', errors: [{ message }] });
    expect(await TeamModel.count()).toBe(1);
  });
});

describe('TeamsRepository.insertTeam', () => {
  it('starts a team with no match of either kind', async () => {
    const { teamId } = await database.teams.insertTeam(team());

    expect(await database.teams.getTeam({ teamId })).toMatchObject({ relayMatchID: null, strategyMatchID: null });
  });
});

describe('TeamsRepository.fetch', () => {
  it('finds the teams whose notes hold every fragment, whatever its case, wildcards read literally', async () => {
    await database.teams.insertTeam(team({ teamname: 'Alpha', other: 'Budapest, 100% motivated, a_b' }));
    await database.teams.insertTeam(team({ teamname: 'Beta', other: 'budapest, 100 percent, axb' }));
    const names = async (filter: string[]) => (await database.teams.fetch(filter)).map(t => t.teamName).sort();

    expect(await names([])).toStrictEqual(['Alpha', 'Beta']);
    expect(await names(['BUDAPEST'])).toStrictEqual(['Alpha', 'Beta']);
    expect(await names(['budapest', 'motivated'])).toStrictEqual(['Alpha']);
    expect(await names(['100%'])).toStrictEqual(['Alpha']);
    expect(await names(['a_b'])).toStrictEqual(['Alpha']);
  });
});

// fetchMatchStates reads bgio-postgres' own table through the model it
// registers, which no API of the library promises: this is what notices a
// release that renames either.
describe('the admin list of teams', () => {
  it('reads every team\'s matches in one query', async () => {
    const G = { start: '2026-03-21T10:00:00.000Z', end: '2999-01-01T00:00:00.000Z', points: 2 };
    await database.db.createMatch('m1', {
      initialState: { G, ctx: { phase: 'play' } } as never,
      metadata: { gameName: 'relay', players: {} } as never,
    });
    const first = await database.teams.insertTeam(team());
    await database.teams.insertTeam(team());
    await TeamModel.update({ relayMatchID: 'm1' }, { where: { teamId: first.teamId } });
    const fetch = vi.spyOn(database.db, 'fetch');

    const views = await adminTeamViews(database.db, await TeamModel.findAll({ order: [['teamName', 'ASC']] }));

    expect(views.map(view => [view.relayMatch, view.strategyMatch])).toStrictEqual([
      [expect.objectContaining({ state: 'IN PROGRESS', matchID: 'm1' }), { state: 'NOT STARTED' }],
      [{ state: 'NOT STARTED' }, { state: 'NOT STARTED' }],
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
