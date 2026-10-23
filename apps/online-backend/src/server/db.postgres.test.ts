import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TeamsRepository } from './db';
import { startTestDatabase } from './test_database';
import { TeamModel } from './model';
import { DeletedTeamModel } from './deletedTeam';

// TeamsRepository against a real postgres (test_database.ts), for what only the
// database decides: the unique constraints the live table has and the archive
// does not, the LIKE escape, and restores that clash with a live team.

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

    // The message is model.ts's, and what the restore route's 409 answer carries.
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

describe('deleting and restoring', () => {
  it('archives a team deleted, imported again and deleted again', async () => {
    const twice = team();
    await database.teams.insertTeam(twice);
    await database.teams.removeTeam(twice.teamId);
    await database.teams.insertTeam(twice);

    expect(await database.teams.removeTeam(twice.teamId)).toBe(1);
    expect(await DeletedTeamModel.count()).toBe(2);
  });

  it('a clashing restore leaves the archive row', async () => {
    const deleted = team();
    await database.teams.insertTeam(deleted);
    await database.teams.removeTeam(deleted.teamId);
    // A new team takes the deleted one's name while it is in the archive.
    await database.teams.insertTeam(team({ teamname: deleted.teamname }));
    const [archived] = await database.teams.listDeletedTeams();

    await expect(database.teams.restoreTeam(archived.deletionId)).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });

    expect(await DeletedTeamModel.count()).toBe(1);
    expect(await database.teams.getTeam({ teamId: deleted.teamId })).toBeNull();
  });

  it('restores the rest of a batch past a clash', async () => {
    const [alpha, beta] = [team({ teamname: 'Alpha' }), team({ teamname: 'Beta' })];
    await database.teams.insertTeam(alpha);
    await database.teams.insertTeam(beta);
    const { deletedAt } = await database.teams.removeAllTeams();
    await database.teams.insertTeam(team({ joinCode: alpha.joinCode }));

    expect(await database.teams.restoreBatch(deletedAt)).toStrictEqual({ restored: ['Beta'], conflicts: ['Alpha'] });
    expect(await DeletedTeamModel.count()).toBe(1);
  });
});
