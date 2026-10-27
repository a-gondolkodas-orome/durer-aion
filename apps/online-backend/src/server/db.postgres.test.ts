import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TeamsRepository } from './db';
import { startTestDatabase } from './test_database';
import { TeamModel } from './model';

// TeamsRepository against a real postgres (test_database.ts), for what only the
// database decides: the unique constraints, a JSON-path WHERE and the LIKE
// escape.

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

describe('TeamsRepository.finishMatch', () => {
  it('writes only to that team, and only while it still holds that match', async () => {
    const inProgress = { state: 'IN PROGRESS', matchID: 'current', startAt: new Date(), endAt: new Date() } as const;
    const { teamId } = await database.teams.insertTeam(team());
    const other = await database.teams.insertTeam(team());
    await TeamModel.update({ strategyMatch: inProgress }, { where: {} });
    const finished = { ...inProgress, state: 'FINISHED', score: 3 } as const;

    expect(await database.teams.finishMatch(teamId, 'strategyMatch', 'stale', { ...finished, matchID: 'stale' })).toBe(false);
    expect(await database.teams.finishMatch(teamId, 'strategyMatch', 'current', finished)).toBe(true);
    expect((await database.teams.getTeam({ teamId }))?.strategyMatch).toMatchObject({ state: 'FINISHED', score: 3 });
    expect((await database.teams.getTeam({ teamId: other.teamId }))?.strategyMatch).toMatchObject({ state: 'IN PROGRESS' });
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
