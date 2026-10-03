import type { PostgresStore } from 'bgio-postgres';
import { Sequelize, UniqueConstraintError, ValidationErrorItem } from 'sequelize';
import { TeamsRepository } from './db';
import { OTHER_IMPORT_MAX_LENGTH, TeamModel } from './model';
import { import_teams_from_tsv } from './team_import';
import { readFileSync } from 'fs';
import { vi, describe, beforeEach, it, expect, type Mock, type MockInstance } from 'vitest';

vi.mock('fs');

// A real repository over a postgres Sequelize that is never connected, as
// model.test.ts uses. `create` is stubbed to run the model's own validators,
// which sequelize runs in process before any SQL, so a row refused here is one
// the real insert refuses too. The unique constraints are the one check that
// lives in postgres itself: `create` fakes the teamName one, and #131 is the rest.
const sequelize = new Sequelize('db', 'user', 'password', { dialect: 'postgres', logging: false });

const TEAM_ID = '8eae8669-125c-42e5-8b49-89afbac31679';
const JOIN_CODE = '111-2222-333';
const CREDENTIALS = '67676767-6767-4767-a767-676767676768';

const HEADER = 'Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials';

function tsv(...rows: string[][]) {
  (readFileSync as Mock).mockReturnValue([HEADER, ...rows.map(row => row.join('\t'))].join('\n'));
}

describe('import_teams_from_tsv', () => {
  let teams: TeamsRepository;
  let create: MockInstance;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(sequelize, 'sync').mockResolvedValue(sequelize);
    teams = new TeamsRepository({ sequelize } as unknown as PostgresStore);
    const names = new Set<string>();
    create = vi.spyOn(TeamModel, 'create').mockImplementation((async (values: TeamModel) => {
      const team = await TeamModel.build(values).validate();
      if (names.has(values.teamName)) {
        throw new UniqueConstraintError({
          errors: [{ message: 'Teamname already exists.' } as ValidationErrorItem],
        });
      }
      names.add(values.teamName);
      return team;
    }) as unknown as typeof TeamModel.create);
  });

  it('should handle a proper header with valid data correctly', async () => {
    tsv(['Test Team', 'C', 'test@example.com', 'Some Info', '', '', '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(create).toHaveBeenCalledTimes(1);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should log a warning if header does not match expected header', async () => {
    (readFileSync as Mock).mockReturnValue(
      'Teamname\tCategory\tOther\tEmail\tID\tLogin Code\tCredentials\nTest Team\tC\ttest@example.com\tSome Info\t\t\t',
    );

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.logs.value).toContain('WARNING: Header not exactly how we defined it. This is not always a problem.');
  });

  it('should fail if the category is invalid', async () => {
    tsv(['Test Team', 'X', 'test@example.com', 'Some Info', '', '', '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.failed).toBe(1);
    expect(result.successful).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('should generate default teamId if missing', async () => {
    tsv(['Test Team', 'C', 'test@example.com', 'Some Info', '', JOIN_CODE, CREDENTIALS]);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(1);
    expect(result.export_table[0][4]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should generate default login_code if missing', async () => {
    tsv(['Test Team', 'C', 'test@example.com', 'Some Info', TEAM_ID, '', CREDENTIALS]);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(1);
    expect(result.export_table[0][5]).toMatch(/^[0-9]{3}-[0-9]{4}-[0-9]{3}$/);
  });

  it('should generate default credentials if missing', async () => {
    tsv(['Test Team', 'C', 'test@example.com', 'Some Info', TEAM_ID, JOIN_CODE, '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(1);
    expect(result.export_table[0][6]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps the values a row supplies', async () => {
    tsv(['Test Team', 'C', 'test@example.com', 'Some Info', TEAM_ID, JOIN_CODE, CREDENTIALS]);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.export_table).toEqual([['Test Team', 'C', 'test@example.com', 'Some Info', TEAM_ID, JOIN_CODE, CREDENTIALS]]);
  });

  describe('refuses a row the model refuses, and goes on', () => {
    it.each([
      ['a login code in the wrong format', ['Bad', 'C', '', 'x', '', 'ABC-123-XYZ', ''], 'JoinCode must be in the format 111-2222-333.'],
      ['a team id that is not a UUID', ['Bad', 'C', '', 'x', 'custom-id', '', ''], 'TeamId must be a UUIDv4.'],
      ['credentials that are not a UUID', ['Bad', 'C', '', 'x', '', '', 'not-a-uuid'], 'Credentials must be a valid UUIDv4.'],
      ['a team name over 255 characters', ['B'.repeat(256), 'C', '', 'x', '', '', ''], 'Teamname must be between 1 and 255 characters.'],
      ['an email over 255 characters', ['Bad', 'C', 'e'.repeat(256), 'x', '', '', ''], 'Email must be between 0 and 255 characters.'],
    ])('%s', async (_, row, message) => {
      tsv(row, ['Good', 'D', '', 'x', '', '', '']);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.failed).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.export_table.map(exported => exported[0])).toEqual(['Good']);
      expect(result.logs.value).toContain(`Failed to validate team when adding to DB: ${message}`);
    });
  });

  it('refuses an other field over the import limit before reaching the model', async () => {
    tsv(['Test Team', 'C', '', 'o'.repeat(OTHER_IMPORT_MAX_LENGTH + 1), '', '', '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.failed).toBe(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('reports a team name the table already has, and goes on', async () => {
    tsv(
      ['Twice', 'C', '', 'first', '', '', ''],
      ['Twice', 'D', '', 'second', '', '', ''],
      ['Once', 'E', '', 'third', '', '', ''],
    );

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.export_table.map(exported => exported[3])).toEqual(['first', 'third']);
    expect(result.logs.value).toContain('Failed to validate team when adding to DB: Teamname already exists.');
  });
});
