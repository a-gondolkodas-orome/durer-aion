import type { PostgresStore } from 'bgio-postgres';
import { Sequelize, UniqueConstraintError, ValidationErrorItem } from 'sequelize';
import { TeamsRepository } from './db';
import { OTHER_IMPORT_MAX_LENGTH, TeamModel } from './model';
import { import_teams_from_tsv } from './team_import';
import { readFileSync } from 'fs';
import type { Mock, MockInstance } from 'vitest';

vi.mock('fs');

// A real repository over a postgres Sequelize that is never connected, as
// model.test.ts uses. `create` is stubbed to run the model's own validators,
// which sequelize runs in process before any SQL, so a row refused here is one
// the real insert refuses too. The unique constraints are the one check that
// lives in postgres itself: `create` fakes the teamName one, and db.postgres.test.ts
// holds the real ones.
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
  // The teams already there when the import reads them.
  let live: TeamModel[];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(sequelize, 'sync').mockResolvedValue(sequelize);
    live = [];
    vi.spyOn(TeamModel, 'findAll').mockImplementation(async () => live);
    teams = new TeamsRepository({ sequelize } as unknown as PostgresStore);
    const names = new Set<string>();
    create = vi.spyOn(TeamModel, 'create').mockImplementation((async (values: TeamModel) => {
      const team = await TeamModel.build(values).validate();
      if (names.has(values.teamName)) {
        throw new UniqueConstraintError({
          // What postgres' refusal carries through sequelize: the column, and
          // the key a unique violation has.
          errors: [{ message: 'Teamname already exists.', path: 'teamName', validatorKey: 'not_unique' } as ValidationErrorItem],
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

  describe('takes Email and Other as optional', () => {
    it.each([
      ['left blank', ['Test Team', 'C', '', '', '', '', '']],
      ['left out, the row ending after Category', ['Test Team', 'C']],
    ])('%s', async (_, row) => {
      tsv(row);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.successful).toBe(1);
      expect(create.mock.calls[0][0]).toMatchObject({ email: '', other: '' });
      // An organiser acts on these, and a warning per team for a column the
      // file need not fill would bury them.
      expect(result.logs.value).toEqual([]);
      expect(result.export_table[0].slice(0, 4)).toEqual(['Test Team', 'C', '', '']);
    });
  });

  // Tabs turned into spaces on the way, as a paste out of a web page or an
  // editor does. Each line then reads as one column, and was skipped as an
  // "empty row": nothing imported, and nothing counted as failed.
  it('refuses a file with no tab, saying it must be tab-separated', async () => {
    (readFileSync as Mock).mockReturnValue('Teamname  Category\nimporttest  D\nsuper name  C\n');

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(0);
    expect(create).not.toHaveBeenCalled();
    // Only that: read as one cell, the header would also seem to lack the
    // columns it plainly names.
    expect(result.logs.value).toEqual([
      'Egy csapat sem került be. A fejlécben nincs tabulátor: az oszlopokat tabulátorral kell elválasztani, nem szóközzel.',
      'A fájl első sora: „Teamname  Category”',
    ]);
  });

  it('does not take an empty first line for a header without tabs', async () => {
    (readFileSync as Mock).mockReturnValue('\nAlpha\tC\n');

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(0);
    expect(result.logs.value[0]).toMatch(/^Egy csapat sem került be\. Az első sornak a fejlécnek kell lennie/);
  });

  it('fails a row with no tab under a header that has them', async () => {
    (readFileSync as Mock).mockReturnValue('Teamname\tCategory\nimporttest  D\nGood\tC\n');

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.logs.value).toEqual(['2. sor: nincs benne tabulátor („importtest  D”), az oszlopokat tabulátorral kell elválasztani, nem szóközzel.']);
  });

  it('passes over blank lines without a word', async () => {
    (readFileSync as Mock).mockReturnValue(`${HEADER}\n\nTest Team\tC\n   \n\r\n`);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.logs.value).toEqual([]);
  });

  describe('reads each column by its header', () => {
    // Read by position, this file put every team's email in its notes and its
    // notes in its email, with only a warning to say so.
    it('whatever the order, and whatever the case', async () => {
      (readFileSync as Mock).mockReturnValue(
        'other\tTEAMNAME\tEmail\tcategory\nSome Info\tTest Team\ttest@example.com\tC\n',
      );

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.successful).toBe(1);
      expect(create.mock.calls[0][0]).toMatchObject({
        teamName: 'Test Team', category: 'C', email: 'test@example.com', other: 'Some Info',
      });
      expect(result.logs.value).toEqual([]);
      // The export keeps the import's own order, so it goes back in as it is.
      expect(result.export_table[0].slice(0, 4)).toEqual(['Test Team', 'C', 'test@example.com', 'Some Info']);
    });

    it('ignores a column it does not know, saying so once', async () => {
      (readFileSync as Mock).mockReturnValue('Teamname\tSchool\tCategory\tPhone\nA\tRadnóti\tC\t1\nB\tPetőfi\tD\t2\n');

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.successful).toBe(2);
      expect(result.logs.value.filter((_, i) => result.logs.sev[i] === 'warn'))
        .toEqual(['Ezeket az oszlopokat nem ismerjük, kimaradnak: School, Phone']);
    });

    // Rows pasted out of a spreadsheet without the line above them: the first
    // team was read as the header and dropped, with the rest imported.
    it('refuses a file whose first line is a team rather than a header', async () => {
      (readFileSync as Mock).mockReturnValue('Alpha\tC\ta@b.com\nBravo\tD\tb@b.com\n');

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.successful).toBe(0);
      expect(create).not.toHaveBeenCalled();
      expect(result.logs.value[0]).toBe('Egy csapat sem került be. Az első sornak a fejlécnek kell lennie, '
        + 'benne legalább a Teamname és a Category oszloppal; ebből hiányzik: Teamname, Category.');
    });

    it('refuses a header that names a column twice', async () => {
      (readFileSync as Mock).mockReturnValue('Teamname\tCategory\tEmail\temail\nA\tC\ta@b.com\tx@y.com\n');

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.successful).toBe(0);
      expect(create).not.toHaveBeenCalled();
      expect(result.logs.value).toContain('Egy csapat sem került be. A fejléc többször is tartalmazza: Email.');
    });
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
      ['a login code in the wrong format', ['Bad', 'C', '', 'x', '', 'ABC-123-XYZ', ''], '2. sor (Bad): a belépőkód nem 111-2222-333 alakú.'],
      ['a team id that is not a UUID', ['Bad', 'C', '', 'x', 'custom-id', '', ''], '2. sor (Bad): az ID nem érvényes UUIDv4.'],
      ['credentials that are not a UUID', ['Bad', 'C', '', 'x', '', '', 'not-a-uuid'], '2. sor (Bad): a Credentials nem érvényes UUID.'],
      ['a team name over 255 characters', ['B'.repeat(256), 'C', '', 'x', '', '', ''], `2. sor (${'B'.repeat(256)}): a csapatnév túl hosszú (legfeljebb 255 karakter).`],
      ['an email over 255 characters', ['Bad', 'C', 'e'.repeat(256), 'x', '', '', ''], '2. sor (Bad): az Email túl hosszú (legfeljebb 255 karakter).'],
    ])('%s', async (_, row, message) => {
      tsv(row, ['Good', 'D', '', 'x', '', '', '']);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result.failed).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.export_table.map(exported => exported[0])).toEqual(['Good']);
      expect(result.logs.value).toEqual([message]);
    });
  });

  it('refuses an other field over the import limit before reaching the model', async () => {
    tsv(['Test Team', 'C', '', 'o'.repeat(OTHER_IMPORT_MAX_LENGTH + 1), '', '', '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.failed).toBe(1);
    expect(create).not.toHaveBeenCalled();
    expect(result.logs.value).toEqual(
      [`2. sor (Test Team): az Other túl hosszú (${OTHER_IMPORT_MAX_LENGTH + 1} karakter, legfeljebb ${OTHER_IMPORT_MAX_LENGTH}).`]);
  });

  // One line per problem, each naming where it is: the admin page lists them
  // as they come, so a line that only says "see above" is no use there.
  it('names the line and the team in each problem, and nothing else', async () => {
    tsv(['Alpha', 'C', '', '', '', '', ''], ['Bravo', 'X', '', '', '', '', ''], ['', 'D', '', '', '', '', '']);

    const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

    expect(result.logs.value).toEqual([
      '3. sor (Bravo): a kategória nem C, D vagy E: „X”.',
      '4. sor: hiányzik a csapatnév.',
    ]);
    expect(result.logs.sev).toEqual(['error', 'error']);
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
    expect(result.logs.value).toEqual(['3. sor (Twice): már van ilyen nevű csapat.']);
  });

  // Re-running a grown registration list is how late teams are added. Each
  // team already there used to fail its row, so one real problem in the file
  // hid among a line per team that was fine.
  describe('a team that is already there', () => {
    let n = 0;
    const liveTeam = (teamName: string, fields: Partial<TeamModel> = {}) => {
      const k = String(++n).padStart(3, '0');
      return TeamModel.build({
        teamName, category: 'C', email: 'a@b.com', other: '', pageState: 'HOME',
        teamId: `8eae8669-125c-42e5-8b49-89afbac31${k}`, joinCode: `111-2222-${k}`,
        credentials: `67676767-6767-4767-a767-676767676${k}`, relayMatchID: null, strategyMatchID: null,
        ...fields,
      });
    };

    it('is left as it is, and all of them are one line, ahead of the real problems', async () => {
      live = Array.from({ length: 12 }, (_, i) => liveTeam(`Old ${i + 1}`));
      tsv(
        ...live.map(team => [team.teamName, 'C', 'a@b.com', '', '', '', '']),
        ['New', 'D', '', '', '', '', ''],
        ['Bad', 'X', '', '', '', '', ''],
      );

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result).toMatchObject({ successful: 1, existing: 12, failed: 1 });
      expect(create).toHaveBeenCalledTimes(1);
      expect(result.logs.value).toEqual([
        '12 csapat már szerepelt, változatlanul hagytuk: '
          + 'Old 1, Old 2, Old 3, Old 4, Old 5, Old 6, Old 7, Old 8, Old 9, Old 10 és még 2.',
        '15. sor (Bad): a kategória nem C, D vagy E: „X”.',
      ]);
      expect(result.export_table.map(row => row[0])).toEqual(['New']);
    });

    it('is recognised from its own identifiers too, as an export fed back is', async () => {
      const there = liveTeam('Alpha');
      live = [there];
      tsv(['Alpha', 'C', 'a@b.com', '', there.teamId, there.joinCode, there.credentials]);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result).toMatchObject({ successful: 0, existing: 1, failed: 0 });
    });

    // The name says one team and the identifier another, which a re-run does
    // not explain: this is a row to look at, so it stays on its own line.
    it('fails a row whose identifiers are not that team\'s', async () => {
      live = [liveTeam('Alpha')];
      tsv(['Alpha', 'C', 'a@b.com', '', '', '999-9999-999', '']);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result).toMatchObject({ successful: 0, existing: 0, failed: 1 });
      expect(result.logs.value).toEqual(['2. sor (Alpha): már van ilyen nevű csapat, de más belépőkód értékkel.']);
    });

    // The import never changes a team that is there, so a category fixed in the
    // file would otherwise not land, and nothing would say so.
    it('says when the file holds another category or email than the team has', async () => {
      live = [liveTeam('Alpha')];
      tsv(['Alpha', 'D', 'new@b.com', '', '', '', '']);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result).toMatchObject({ successful: 0, existing: 1, failed: 0 });
      expect(create).not.toHaveBeenCalled();
      expect(result.logs.value).toEqual([
        '1 csapat már szerepelt, változatlanul hagytuk: Alpha.',
        '2. sor (Alpha): már szerepel, C kategóriával; a fájlbeli D nem került át.',
        '2. sor (Alpha): már szerepel, más e-mail címmel; a fájlbeli nem került át.',
      ]);
    });

    // Two rows of one file naming the same team are a mistake in the file,
    // not a re-run, so the second still fails.
    it('is not a team the same file added a line earlier', async () => {
      tsv(['Twice', 'C', '', '', '', '', ''], ['Twice', 'D', '', '', '', '', '']);

      const result = await import_teams_from_tsv(teams, 'dummy_file.tsv');

      expect(result).toMatchObject({ successful: 1, existing: 0, failed: 1 });
    });
  });
});
