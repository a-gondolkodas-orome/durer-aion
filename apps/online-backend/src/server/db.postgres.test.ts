import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TeamsRepository } from './db';
import { startTestDatabase } from './test_database';
import { OTHER_MAX_LENGTH, TeamModel } from './model';

// TeamsRepository against a real postgres (test_database.ts), for what only the
// database decides: the unique constraints, the LIKE escape, and the edits
// those refuse.

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

describe('TeamsRepository.editTeam', () => {
  it('changes the name and the category, leaving the old ones in other', async () => {
    const { teamId } = await database.teams.insertTeam(team({ teamname: 'Pitagorasz Csapat', other: 'Budapest' }));

    await database.teams.editTeam(teamId, { teamName: 'Pitagorasz', category: 'D' });

    expect(await database.teams.getTeam({ teamId })).toMatchObject({
      teamName: 'Pitagorasz',
      category: 'D',
      other: 'Budapest prevname:"Pitagorasz Csapat" prevcat:C',
    });
  });

  it('leaves a note only for what changed, and none when nothing did', async () => {
    const { teamId } = await database.teams.insertTeam(team({ teamname: 'Alpha' }));

    await database.teams.editTeam(teamId, { teamName: 'Alpha', category: 'C' });
    expect((await database.teams.getTeam({ teamId }))?.other).toBe('');

    await database.teams.editTeam(teamId, { teamName: 'Alpha', category: 'E' });
    expect((await database.teams.getTeam({ teamId }))?.other).toBe('prevcat:C');
  });

  it.each(['relayMatchID', 'strategyMatchID'] as const)('refuses a team with a %s, and changes nothing', async (match) => {
    const { teamId } = await database.teams.insertTeam(team({ teamname: 'Alpha' }));
    await TeamModel.update({ [match]: 'played' }, { where: { teamId } });

    expect(await database.teams.editTeam(teamId, { teamName: 'Beta' })).toBe('started');
    expect((await database.teams.getTeam({ teamId }))?.teamName).toBe('Alpha');
  });

  // A reset puts the match back to NOT STARTED, so a team that played in the
  // wrong category can be moved and play again.
  it('edits a team again once its matches are reset', async () => {
    const { teamId } = await database.teams.insertTeam(team());
    await TeamModel.update({ relayMatchID: 'played' }, { where: { teamId } });
    expect(await database.teams.editTeam(teamId, { category: 'D' })).toBe('started');

    await TeamModel.update({ relayMatchID: null }, { where: { teamId } });
    expect(await database.teams.editTeam(teamId, { category: 'D' })).toMatchObject({ category: 'D' });
  });

  it('refuses a name another team has, and changes nothing', async () => {
    await database.teams.insertTeam(team({ teamname: 'Beta' }));
    const { teamId } = await database.teams.insertTeam(team({ teamname: 'Alpha' }));

    await expect(database.teams.editTeam(teamId, { teamName: 'Beta', category: 'D' }))
      .rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    expect(await database.teams.getTeam({ teamId })).toMatchObject({ teamName: 'Alpha', category: 'C', other: '' });
  });

  it('refuses an edit whose notes would not fit in other', async () => {
    const full = 'x'.repeat(OTHER_MAX_LENGTH - 5);
    const { teamId } = await database.teams.insertTeam(team({ teamname: 'Alpha' }));
    await TeamModel.update({ other: full }, { where: { teamId } });

    expect(await database.teams.editTeam(teamId, { category: 'D' })).toBe('notes-full');
    expect(await database.teams.getTeam({ teamId })).toMatchObject({ category: 'C', other: full });
  });

  it('answers not-found for a team it does not have', async () => {
    expect(await database.teams.editTeam('8eae8669-125c-42e5-8b49-000000000000', { category: 'D' })).toBe('not-found');
  });
});
