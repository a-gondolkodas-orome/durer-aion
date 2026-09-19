import { randomInt } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ValidationError } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TEAM_IMPORT_HEADER } from 'schemas';
import { NewTeam, TeamsRepository } from './db';
import { import_teams_from_tsv_locally, importTeamsFromTsv } from './team_import';

// Only `randomInt` is replaceable, and `beforeEach` puts the real one back —
// `mockReset` restores the implementation `vi.fn` was given. The join code
// collisions below are the only tests that have to know what will be drawn, and
// a leftover implementation would make every later row draw the same code
// forever, which is a hang rather than a failure.
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return { ...actual, randomInt: vi.fn(actual.randomInt) };
});

// The command-line entry point reads and writes beside the file it was given.
// Only those three are replaced, so anything else reaching for `fs` during a
// run — vitest included — still gets the real one.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
  };
});

const HEADER = TEAM_IMPORT_HEADER.join('\t');

const row = (teamname: string, rest: string[] = []) =>
  [teamname, 'C', 'a@b.com', 'Kovács Anna — Példa Gimnázium', ...rest].join('\t');

const file = (...rows: string[]) => [HEADER, ...rows].join('\n');

/** A repository that answers but records, in the style of `team_remove.test.ts`:
 * no database, and the calls are what the assertions read. */
function stubTeams(taken: Partial<{ teamIds: string[], teamNames: string[], joinCodes: string[] }> = {}) {
  return {
    connect: vi.fn(),
    takenIdentifiers: vi.fn().mockResolvedValue({
      teamIds: new Set(taken.teamIds ?? []),
      teamNames: new Set(taken.teamNames ?? []),
      joinCodes: new Set(taken.joinCodes ?? []),
    }),
    insertTeams: vi.fn().mockResolvedValue(null),
  } as unknown as TeamsRepository;
}

const inserted = (teams: TeamsRepository): { row: number, team: NewTeam }[] =>
  (teams.insertTeams as unknown as Mock).mock.calls[0][0] as { row: number, team: NewTeam }[];

const codes = (problems: { code: string }[]) => problems.map(problem => problem.code);

beforeEach(() => {
  vi.clearAllMocks();
  (randomInt as unknown as Mock).mockReset();
});

describe('importTeamsFromTsv', () => {
  it('imports a row and fills the cells the file left blank', async () => {
    const teams = stubTeams();

    const result = await importTeamsFromTsv(teams, file(row('Alpha')));

    expect(result.imported).toBe(1);
    expect(result.rows).toBe(1);
    expect(result.problems).toEqual([]);

    const [only] = inserted(teams);
    expect(only.row).toBe(2);
    expect(only.team.teamId).toMatch(/^[0-9a-f-]{36}$/);
    expect(only.team.joinCode).toMatch(/^[0-9]{3}-[0-9]{4}-[0-9]{3}$/);
    expect(only.team.credentials).toMatch(/^[0-9a-f-]{36}$/);

    // The export table is the only copy of what was generated.
    expect(result.exportTable).toEqual([[
      'Alpha', 'C', 'a@b.com', 'Kovács Anna — Példa Gimnázium',
      only.team.teamId, only.team.joinCode, only.team.credentials,
    ]]);
  });

  it('keeps a supplied id, join code and credentials', async () => {
    const teams = stubTeams();
    const supplied = ['20638d0e-ac06-4e72-a734-b4fcdcaee425', '692-2481-797', 'a5303260-816d-4474-9024-42090672d74d'];

    await importTeamsFromTsv(teams, file(row('Alpha', supplied)));

    expect(inserted(teams)[0].team).toMatchObject({
      teamId: supplied[0], joinCode: supplied[1], credentials: supplied[2],
    });
  });

  it('writes nothing at all when one row is wrong', async () => {
    const teams = stubTeams();
    const bad = ['Bravo', 'X', 'a@b.com', 'x'].join('\t');

    const result = await importTeamsFromTsv(teams, file(row('Alpha'), bad));

    // The good row is not written either: the file is all or nothing, so the
    // organiser can fix it and upload the same file again.
    expect(teams.insertTeams).not.toHaveBeenCalled();
    expect(result.imported).toBe(0);
    expect(result.exportTable).toEqual([]);
    expect(codes(result.problems)).toEqual(['invalid-category']);
    expect(result.problems[0].row).toBe(3);
  });

  it('imports despite a mismatched header, which is only a warning', async () => {
    const teams = stubTeams();
    const content = ['Name\tCat\tMail\tNotes\tID\tCode\tCreds', row('Alpha')].join('\n');

    const result = await importTeamsFromTsv(teams, content);

    expect(result.imported).toBe(1);
    expect(codes(result.problems)).toEqual(['header-mismatch']);
  });

  it('reports errors before warnings', async () => {
    const teams = stubTeams();
    // No "Other" on either row — a warning each — and a bad category on the second.
    const content = file(['Alpha', 'C', 'a@b.com', ''].join('\t'), ['Bravo', 'X', 'a@b.com', ''].join('\t'));

    const result = await importTeamsFromTsv(teams, content);

    expect(codes(result.problems)).toEqual(['invalid-category', 'other-missing', 'other-missing']);
  });

  it('orders the errors by line, wherever they were found', async () => {
    // The clashes with live teams are found only after the file is parsed, so
    // without a sort this answer would read line 3 before line 2 — and the
    // grid the admin page draws lists them in the order they arrive.
    const teams = stubTeams({ teamNames: ['Alpha'] });
    const bad = ['Bravo', 'X', 'a@b.com', 'x'].join('\t');

    const result = await importTeamsFromTsv(teams, file(row('Alpha'), bad));

    expect(codes(result.problems)).toEqual(['teamname-taken', 'invalid-category']);
    expect(result.problems.map(problem => problem.row)).toEqual([2, 3]);
  });

  describe('against the teams already in the database', () => {
    it('refuses a team name a live team holds, naming the row', async () => {
      const teams = stubTeams({ teamNames: ['Alpha'] });

      const result = await importTeamsFromTsv(teams, file(row('Alpha')));

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(result.problems).toEqual([
        { row: 2, column: 'Teamname', severity: 'error', code: 'teamname-taken', found: 'Alpha' },
      ]);
    });

    it('refuses a join code a live team holds', async () => {
      const teams = stubTeams({ joinCodes: ['692-2481-797'] });

      const result = await importTeamsFromTsv(teams, file(row('Alpha', ['', '692-2481-797'])));

      expect(codes(result.problems)).toEqual(['join-code-taken']);
    });

    it('refuses an id a live team holds', async () => {
      const teamId = '20638d0e-ac06-4e72-a734-b4fcdcaee425';
      const teams = stubTeams({ teamIds: [teamId] });

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [teamId])));

      expect(codes(result.problems)).toEqual(['team-id-taken']);
    });

    it('draws again rather than generating a join code that is already in use', async () => {
      // Ten 1s, then ten 2s: the first code drawn is one a live team holds.
      const digits = [...Array<number>(10).fill(1), ...Array<number>(10).fill(2)];
      let drawn = 0;
      (randomInt as unknown as Mock).mockImplementation(() => digits[drawn++]);
      const teams = stubTeams({ joinCodes: ['111-1111-111'] });

      const result = await importTeamsFromTsv(teams, file(row('Alpha')));

      expect(inserted(teams)[0].team.joinCode).toBe('222-2222-222');
      expect(result.imported).toBe(1);
    });

    it('does not give two rows of one file the same generated join code', async () => {
      const digits = [...Array<number>(10).fill(1), ...Array<number>(10).fill(2)];
      let drawn = 0;
      (randomInt as unknown as Mock).mockImplementation(() => digits[drawn++]);
      const teams = stubTeams();

      await importTeamsFromTsv(teams, file(row('Alpha'), row('Bravo')));

      const [first, second] = inserted(teams);
      expect(first.team.joinCode).toBe('111-1111-111');
      expect(second.team.joinCode).toBe('222-2222-222');
    });
  });

  // A constraint the database refused, rather than a rule sequelize checked
  // itself: `UniqueConstraintError` defaults `errors` to `[]`, and a refusal
  // quoting nothing would leave the admin a row number and no reason.
  it('quotes the error itself when the database gave no per-field message', async () => {
    const teams = stubTeams();
    const error = { errors: [], message: 'duplicate key value violates unique constraint' } as unknown as ValidationError;
    (teams.insertTeams as unknown as Mock).mockResolvedValue({ failedRow: 2, error });

    const result = await importTeamsFromTsv(teams, file(row('Alpha')));

    expect(result.problems).toEqual([{
      row: 2, severity: 'error', code: 'database-refused',
      found: 'duplicate key value violates unique constraint',
    }]);
  });

  it('names the row the database refused, and imports nothing', async () => {
    const teams = stubTeams();
    // Only the messages are read, so this is the shape rather than the class,
    // whose constructor takes eight arguments to say the same thing.
    const error = { errors: [{ message: 'Teamname already exists.' }] } as ValidationError;
    (teams.insertTeams as unknown as Mock).mockResolvedValue({ failedRow: 3, error });

    const result = await importTeamsFromTsv(teams, file(row('Alpha'), row('Bravo')));

    expect(result.imported).toBe(0);
    expect(result.exportTable).toEqual([]);
    expect(result.problems).toEqual([
      { row: 3, severity: 'error', code: 'database-refused', found: 'Teamname already exists.' },
    ]);
  });

  describe('a dry run', () => {
    it('checks the file and writes nothing', async () => {
      const teams = stubTeams({ teamNames: ['Alpha'] });

      const result = await importTeamsFromTsv(teams, file(row('Alpha'), row('Bravo')), { dryRun: true });

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(result.imported).toBe(0);
      expect(result.rows).toBe(2);
      expect(codes(result.problems)).toEqual(['teamname-taken']);
    });

    it('writes nothing even when the file is clean', async () => {
      const teams = stubTeams();

      const result = await importTeamsFromTsv(teams, file(row('Alpha')), { dryRun: true });

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(result.problems).toEqual([]);
      expect(result.imported).toBe(0);
    });
  });

  it('does not sync the schema: that is the standalone importer\'s job, not a request\'s', async () => {
    const teams = stubTeams();

    await importTeamsFromTsv(teams, file(row('Alpha')));

    expect(teams.connect).not.toHaveBeenCalled();
  });

  describe('at the size a competition actually imports', () => {
    const many = (count: number) =>
      file(...Array.from({ length: count }, (_, index) => row(`Team ${index}`)));

    it('sends 500 rows to the database as one call, with no problems', async () => {
      const teams = stubTeams();

      const result = await importTeamsFromTsv(teams, many(500));

      expect(teams.insertTeams).toHaveBeenCalledTimes(1);
      expect(inserted(teams)).toHaveLength(500);
      expect(result.imported).toBe(500);
      expect(result.problems).toEqual([]);
      // 500 join codes, all different.
      expect(new Set(inserted(teams).map(entry => entry.team.joinCode)).size).toBe(500);
    });

    it('caps the problems rather than answering with thousands', async () => {
      const teams = stubTeams();
      // Every row is missing "Other", which is a warning per row.
      const rows = Array.from({ length: 500 }, (_, index) => `Team ${index}\tC\ta@b.com\t`);

      const result = await importTeamsFromTsv(teams, file(...rows));

      expect(result.problems).toHaveLength(200);
      expect(result.problemsTruncated).toBe(300);
    });

    // The cap decides how much is listed. A caller counting the rows in that
    // list would tell the organiser 200 of their 500 rows are bad, directly
    // above the line saying the list is not all of them.
    it('counts every bad row, not the ones that fit under the cap', async () => {
      const teams = stubTeams();
      // Every row has a bad category, which is an error per row.
      const rows = Array.from({ length: 500 }, (_, index) => `Team ${index}\tX\ta@b.com\tSuli`);

      const result = await importTeamsFromTsv(teams, file(...rows));

      expect(result.problems).toHaveLength(200);
      expect(result.badRows).toBe(500);
    });

    it('counts a row breaking several rules once', async () => {
      const teams = stubTeams();

      const result = await importTeamsFromTsv(teams, file(`\tX\ta@b.com\tSuli`));

      expect(codes(result.problems)).toEqual(['empty-teamname', 'invalid-category']);
      expect(result.badRows).toBe(1);
    });

    it('counts a row refused unread, and calls the file one row long', async () => {
      const teams = stubTeams();

      // A tab inside "Other", on a row that fills every column: the shifted
      // values run past the last one, so the row is never parsed — and counting
      // the parsed rows instead would report a bad row the file supposedly does
      // not have. (A shift on a row whose last cells are blank has nothing to
      // push out here; the parser catches that one through the columns the
      // values land in.)
      const shifted = ['Alpha', 'C', 'a@b.com', 'Suli', 'extra',
        '20638d0e-ac06-4e72-a734-b4fcdcaee425', '692-2481-797',
        'a5303260-816d-4474-9024-42090672d74d'].join('\t');
      const result = await importTeamsFromTsv(teams, file(shifted));

      expect(codes(result.problems)).toEqual(['wrong-column-count']);
      expect(result.badRows).toBe(1);
      expect(result.rows).toBe(1);
    });

    // A missing header, or no rows at all, is a problem with the file and sits
    // on no line of it.
    it('does not count a problem about the file as a bad row', async () => {
      const teams = stubTeams();

      const result = await importTeamsFromTsv(teams, HEADER);

      expect(codes(result.problems)).toEqual(['no-rows']);
      expect(result.badRows).toBe(0);
    });
  });
});

/** The command line around the same import: what it answers its shell, and what
 * it leaves on disk. `import_teams.js` turns the answer into an exit code. */
describe('import_teams_from_tsv_locally', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    // The function reports to the console by design, and the run is meant to
    // have the report to itself — so the messages are collected and asserted
    // on rather than written.
    for (const method of ['info', 'warn', 'error'] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        logged.push(args.join(' '));
      });
    }
    vi.mocked(existsSync).mockReturnValue(false);
  });

  // Put back, so a test added after this block still has the setup file's
  // recorder underneath it and fails on anything it writes.
  afterEach(() => { vi.restoreAllMocks(); });

  it('says it imported, and writes the join codes beside the file', async () => {
    const teams = stubTeams();
    vi.mocked(readFileSync).mockReturnValue(file(row('Alpha')));

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(true);

    expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe('teams.tsv.export');
    expect(logged).toContain('Successfully imported 1 teams.');
  });

  // Returning normally made `import_teams.js` exit 0, so a shell — and
  // `scripts/import_teams.sh` is one — saw a load that refused every row as a
  // load that worked.
  it('says it did not import when the file was refused', async () => {
    const teams = stubTeams();
    vi.mocked(readFileSync).mockReturnValue(file(row('Alpha', ['', '', '']), `\tC\ta@b.com\tSuli`));

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(false);

    expect(teams.insertTeams).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  // Nothing was written, so the export next to the file is the earlier run's,
  // holding that run's join codes — and DEPLOYMENT.md has an organiser fetch
  // that file off the host and mail it out.
  it('warns that an export from an earlier run was left as it was', async () => {
    const teams = stubTeams();
    vi.mocked(readFileSync).mockReturnValue(file(`\tC\ta@b.com\tSuli`));
    vi.mocked(existsSync).mockReturnValue(true);

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(false);

    expect(logged.join('\n')).toContain('teams.tsv.export is from an earlier run');
  });

  it('does not mention an export that is not there', async () => {
    const teams = stubTeams();
    vi.mocked(readFileSync).mockReturnValue(file(`\tC\ta@b.com\tSuli`));

    await import_teams_from_tsv_locally(teams, 'teams.tsv');

    expect(logged.join('\n')).not.toContain('earlier run');
  });
});
