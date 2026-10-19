import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UniqueConstraintError } from 'sequelize';
import { describe, it, expect, beforeAll, beforeEach, afterAll, onTestFinished } from 'vitest';
import { startTestDatabase } from './pglite';
import { TeamModel } from './model';
import { DeletedTeamModel } from './deletedTeam';
import { import_teams_from_tsv } from './team_import';

// TeamsRepository against a real postgres (pglite.ts), for what only the
// database decides: the unique constraints, what a transaction rolls back, a
// JSON-path WHERE and ILIKE. db.test.ts holds the SQL these render.

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
function team(overrides: Partial<Parameters<typeof database.teams.insertTeam>[0]> = {}) {
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

describe('the schema sync() creates', () => {
  it.each([
    ['teamId', 'teamId'],
    ['joinCode', 'joinCode'],
    ['teamname', 'teamName'],
    ['credentials', 'credentials'],
  ] as const)('refuses a second team with the same %s', async (field, column) => {
    const first = team();
    await database.teams.insertTeam(first);

    const error = await database.teams.insertTeam(team({ [field]: first[field] })).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UniqueConstraintError);
    expect((error as UniqueConstraintError).errors[0].path).toBe(column);
    expect(await TeamModel.count()).toBe(1);
  });

  it('stores the match columns as JSON', async () => {
    await database.teams.insertTeam(team());
    const [[row]] = await database.db.sequelize.query(
      `SELECT pg_typeof("relayMatch")::text AS type FROM "Teams"`,
    ) as [{ type: string }[], unknown];
    expect(row.type).toBe('json');
  });
});

describe('import_teams_from_tsv', () => {
  it('fails a row repeating a join code the database already holds, and imports the rest', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'teams-'));
    onTestFinished(() => rmSync(directory, { recursive: true }));
    const file = join(directory, 'teams.tsv');
    const [alpha, beta, gamma] = [team(), team(), team()];
    const row = (t: ReturnType<typeof team>, joinCode = t.joinCode) =>
      [t.teamname, 'C', t.email, 'notes', t.teamId, joinCode, t.credentials].join('\t');
    writeFileSync(file, [
      'Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials',
      row(alpha), row(beta, alpha.joinCode), row(gamma),
    ].join('\n'));

    const result = await import_teams_from_tsv(database.teams, file);

    expect(result).toMatchObject({ successful: 2, failed: 1 });
    expect(result.logs.value).toContain('Failed to validate team when adding to DB: JoinCode already exists.');
    expect((await database.teams.listTeams())?.map(t => t.teamName).sort()).toStrictEqual([alpha.teamname, gamma.teamname]);
  });
});

describe('TeamsRepository.finishMatch', () => {
  it('writes only while the team still holds that match', async () => {
    const { teamId } = await database.teams.insertTeam(team());
    await TeamModel.update({ strategyMatch: { state: 'IN PROGRESS', matchID: 'current', startAt: new Date(), endAt: new Date() } }, { where: { teamId } });
    const finished = { state: 'FINISHED', matchID: 'current', startAt: new Date(), endAt: new Date(), score: 3 } as const;

    expect(await database.teams.finishMatch(teamId, 'strategyMatch', 'stale', { ...finished, matchID: 'stale' })).toBe(false);
    expect(await database.teams.finishMatch(teamId, 'strategyMatch', 'current', finished)).toBe(true);
    expect((await database.teams.getTeam({ teamId }))?.strategyMatch).toMatchObject({ state: 'FINISHED', score: 3 });
  });
});

describe('TeamsRepository.fetch', () => {
  it('ignores case, and reads % in a fragment as a literal', async () => {
    await database.teams.insertTeam(team({ teamname: 'Alpha', other: 'Budapest, 100% motivated' }));
    await database.teams.insertTeam(team({ teamname: 'Beta', other: 'budapest, 100 percent' }));

    expect((await database.teams.fetch(['BUDAPEST'])).map(t => t.teamName).sort()).toStrictEqual(['Alpha', 'Beta']);
    expect((await database.teams.fetch(['100%'])).map(t => t.teamName)).toStrictEqual(['Alpha']);
  });
});

describe('deleting and restoring', () => {
  it('archives a deleted team, and a second delete finds nothing', async () => {
    const { teamId } = await database.teams.insertTeam(team());

    expect(await database.teams.removeTeam(teamId)).toBe(1);
    expect(await database.teams.removeTeam(teamId)).toBe(0);
    expect(await TeamModel.count()).toBe(0);
    expect(await DeletedTeamModel.count({ where: { teamId } })).toBe(1);
  });

  it('rolls a clashing restore back, keeping the archived row', async () => {
    const deleted = team();
    await database.teams.insertTeam(deleted);
    await database.teams.removeTeam(deleted.teamId);
    // A new team takes the deleted one's name while it is in the archive.
    await database.teams.insertTeam(team({ teamname: deleted.teamname }));
    const [archived] = await database.teams.listDeletedTeams();

    await expect(database.teams.restoreTeam(archived.deletionId)).rejects.toBeInstanceOf(UniqueConstraintError);

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
