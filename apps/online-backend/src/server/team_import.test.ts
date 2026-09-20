import { randomInt } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ValidationError } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { OTHER_IMPORT_MAX_LENGTH, TEAM_IMPORT_HEADER } from 'schemas';
import { LiveTeam, NewTeam, TeamsRepository } from './db';
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

const LIVE_ID = '20638d0e-ac06-4e72-a734-b4fcdcaee425';
const LIVE_CODE = '692-2481-797';

/** A team the database already holds. The defaults are what `row` above writes,
 * so a test spells out only the column it is actually about — and a row naming
 * this team, with nothing else filled in, is the same team. */
const liveTeam = (team: Partial<LiveTeam> = {}): LiveTeam => ({
  teamId: LIVE_ID,
  teamName: 'Alpha',
  joinCode: LIVE_CODE,
  category: 'C',
  email: 'a@b.com',
  ...team,
});

/** A repository that answers but records, in the style of `team_remove.test.ts`:
 * no database, and the calls are what the assertions read. */
function stubTeams(live: LiveTeam[] = []) {
  return {
    connect: vi.fn(),
    liveTeams: vi.fn().mockResolvedValue(live),
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

  // The archive round trip README.md § *Checking it works* asks for: a batch
  // downloaded as import-TSV and fed back. `other` carries the audit trail the
  // admin routes append, so a team reset often enough comes back longer than
  // the import keeps — and all-or-nothing means refusing that one row would
  // refuse the batch.
  it('imports a batch whose notes outgrew what the import keeps', async () => {
    const teams = stubTeams();
    const grown = `${'a'.repeat(OTHER_IMPORT_MAX_LENGTH - 10)} prevstratid:0EKBiMgbJ5A`;
    const content = file(
      ['Alpha', 'C', 'a@b.com', grown, '', '', ''].join('\t'),
      row('Bravo'),
    );

    const result = await importTeamsFromTsv(teams, content);

    expect(result.imported).toBe(2);
    expect(codes(result.problems)).toEqual(['other-truncated']);
    expect(inserted(teams)[0].team.other).toBe(grown.slice(0, OTHER_IMPORT_MAX_LENGTH));
    // The row it is about, not the file: the organiser has to find it again.
    expect(result.problems[0].row).toBe(2);
    // A warning, so it is not one of the rows that would refuse the file.
    expect(result.badRows).toBe(0);
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
    const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);
    const bad = ['Bravo', 'X', 'a@b.com', 'x'].join('\t');
    // A join code the live Alpha does not hold, so this row is a different team
    // wanting a name that is taken rather than the team that already has it.
    const clash = row('Alpha', ['', '999-9999-999']);

    const result = await importTeamsFromTsv(teams, file(clash, bad));

    expect(codes(result.problems)).toEqual(['teamname-taken', 'invalid-category']);
    expect(result.problems.map(problem => problem.row)).toEqual([2, 3]);
  });

  describe('against the teams already in the database', () => {
    it('refuses a team name a live team holds, naming the row', async () => {
      // Identity is the name, so this row has to disagree with the live Alpha
      // on something to be a different team wanting its name: the join code.
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', ['', '999-9999-999'])));

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(result.problems).toEqual([
        { row: 2, column: 'Teamname', severity: 'error', code: 'teamname-taken', found: 'Alpha' },
      ]);
    });

    it('refuses a join code a live team holds', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Zulu', joinCode: LIVE_CODE })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', ['', LIVE_CODE])));

      expect(codes(result.problems)).toEqual(['join-code-taken']);
    });

    it('refuses an id a live team holds', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Zulu', teamId: LIVE_ID })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [LIVE_ID])));

      expect(codes(result.problems)).toEqual(['team-id-taken']);
    });

    // Re-uploading a registration list is how late teams are added: the teams
    // already there are recognised and left alone rather than refusing the file
    // and sending the organiser to trim it by hand on a competition morning.
    it('accepts a row naming a team that is already there, and writes nothing', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha')));

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(result.imported).toBe(0);
      expect(result.accepted).toBe(1);
      expect(result.refused).toBe(false);
      expect(codes(result.problems)).toEqual(['already-exists']);
    });

    it('imports the new teams of a file whose others are already there', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha'), row('Bravo')));

      expect(result.imported).toBe(1);
      expect(result.accepted).toBe(1);
      expect(inserted(teams).map(entry => entry.team.teamname)).toEqual(['Bravo']);
    });

    it('takes the identifiers the row supplies as confirmation, not as a clash', async () => {
      // What feeding an export straight back looks like: every cell filled in,
      // and every one of them this team's own.
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [LIVE_ID, LIVE_CODE])));

      expect(result.accepted).toBe(1);
      expect(codes(result.problems)).toEqual(['already-exists']);
    });

    // The name says one team and the id another. Accepting either reading would
    // be a guess, and one of them writes a team under an identifier it does not
    // own, so the file is refused and the organiser decides.
    it('refuses a row whose identifiers point at different live teams', async () => {
      const otherId = 'b5646f04-2591-4afc-9ae7-4350562c0649';
      const teams = stubTeams([
        liveTeam({ teamName: 'Alpha' }),
        liveTeam({ teamName: 'Zulu', teamId: otherId, joinCode: '111-1111-111' }),
      ]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [otherId])));

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(codes(result.problems)).toEqual(['teamname-taken', 'team-id-taken']);
    });

    // An organiser who fixed a category in the file and re-uploaded it has to
    // learn that the fix did not land: the team would otherwise be served the
    // wrong games for the whole round, with the page reporting a clean import.
    it('warns when an accepted row disagrees with the live team, and changes nothing', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha', category: 'E', email: 'old@b.com' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha')));

      expect(teams.insertTeams).not.toHaveBeenCalled();
      expect(codes(result.problems)).toEqual(['already-exists', 'category-differs', 'email-differs']);
      expect(result.problems[1]).toMatchObject({ column: 'Category', found: 'C ≠ E' });
      // Warnings: the file still loads, and these are not rows at fault.
      expect(result.badRows).toBe(0);
    });

    // `other` is the one column the admin routes write to themselves, appending
    // an audit trail. Comparing it would warn on every re-upload of a file that
    // is otherwise exactly right.
    it('says nothing about an accepted row whose notes have moved on', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);
      const content = file(['Alpha', 'C', 'a@b.com', 'quite different notes'].join('\t'));

      const result = await importTeamsFromTsv(teams, content);

      expect(codes(result.problems)).toEqual(['already-exists']);
    });

    // One upload of a whole list should give back one file to mail, not a new
    // one to splice onto the last. The accepted teams' codes come from the file
    // itself, never read back out of the database: no screen here shows a join
    // code, and this download is not the place to become the first.
    it('carries an accepted team whose code the file supplied into the export', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [LIVE_ID, LIVE_CODE]), row('Bravo')));

      expect(result.exportTable).toHaveLength(2);
      // The file's own order, so it reads against the file the organiser sent.
      expect(result.exportTable[0]).toEqual([
        'Alpha', 'C', 'a@b.com', 'Kovács Anna — Példa Gimnázium', LIVE_ID, LIVE_CODE, '',
      ]);
      expect(result.exportTable[1][0]).toBe('Bravo');
    });

    it('leaves out an accepted team the file had no code for', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha'), row('Bravo')));

      expect(result.exportTable.map(exported => exported[0])).toEqual(['Bravo']);
    });

    it('exports nothing when every team in the file is already there', async () => {
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const result = await importTeamsFromTsv(teams, file(row('Alpha', [LIVE_ID, LIVE_CODE])));

      // There are no new codes to mail, so handing the organiser their own file
      // back as a download would be noise.
      expect(result.exportTable).toEqual([]);
    });

    it('draws again rather than generating a join code that is already in use', async () => {
      // Ten 1s, then ten 2s: the first code drawn is one a live team holds.
      const digits = [...Array<number>(10).fill(1), ...Array<number>(10).fill(2)];
      let drawn = 0;
      (randomInt as unknown as Mock).mockImplementation(() => digits[drawn++]);
      const teams = stubTeams([liveTeam({ teamName: 'Zulu', joinCode: '111-1111-111' })]);

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
      const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);

      const clash = row('Alpha', ['', '999-9999-999']);

      const result = await importTeamsFromTsv(teams, file(clash, row('Bravo')), { dryRun: true });

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

      expect(codes(result.problems)).toEqual(Array<string>(20).fill('other-missing'));
      expect(result.problemsTruncated).toBe(480);
      // The list is short; the count is the file's own, so a caller collapsing
      // these into one line can still say how many rows it stands for.
      expect(result.warningCounts).toEqual({ 'other-missing': 500 });
    });

    // A flat cap sorted the warnings by line and took the first 200, so the one
    // warning that says a value was *changed* on its way in could be pushed off
    // the end by a column of cosmetic ones — and the row went in truncated with
    // nothing naming it. It is the archive round trip in README.md § *Checking
    // it works* that this would quietly break.
    it('keeps a warning about changed data behind a column of repeated ones', async () => {
      const teams = stubTeams();
      const grown = `${'a'.repeat(OTHER_IMPORT_MAX_LENGTH)} prevstratid:0EKBiMgbJ5A`;
      const rows = [
        ...Array.from({ length: 400 }, (_, index) => `Team ${index}\tC\ta@b.com\t`),
        ['Late', 'C', 'a@b.com', grown].join('\t'),
      ];

      const result = await importTeamsFromTsv(teams, file(...rows));

      expect(result.imported).toBe(401);
      expect(codes(result.problems)).toContain('other-truncated');
      expect(result.warningCounts).toEqual({ 'other-missing': 400, 'other-truncated': 1 });
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

  // Re-running a file is how late teams are added, so running one that has not
  // grown since is the ordinary answer rather than a failure: exit 0, and the
  // export from the run that did import is left where it is.
  it('succeeds without writing when every team in the file is already there', async () => {
    const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);
    vi.mocked(readFileSync).mockReturnValue(file(row('Alpha')));

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(true);

    expect(writeFileSync).not.toHaveBeenCalled();
    expect(logged).toContain('Nothing to import: all 1 teams in the file are already there.');
  });

  it('says how many were already there alongside what it imported', async () => {
    const teams = stubTeams([liveTeam({ teamName: 'Alpha' })]);
    vi.mocked(readFileSync).mockReturnValue(file(row('Alpha'), row('Bravo')));

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(true);

    expect(logged).toContain('Successfully imported 1 teams.');
    expect(logged).toContain('1 more were already there and were left as they are.');
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

  // The teams are committed by the time the export is written, and `teamName`
  // is unique, so the run cannot be repeated to remake the codes. Throwing
  // from here exited 1 — the status that now says `imported nothing`, whose
  // message sends the operator to run the file again.
  it('prints the join codes when the export file cannot be written', async () => {
    const teams = stubTeams();
    vi.mocked(readFileSync).mockReturnValue(file(row('Alpha')));
    vi.mocked(writeFileSync).mockImplementation(() => { throw new Error('EROFS: read-only file system'); });

    expect(await import_teams_from_tsv_locally(teams, 'teams.tsv')).toBe(true);

    const said = logged.join('\n');
    expect(said).toContain('EROFS: read-only file system');
    expect(said).toContain('running this file again will not work');
    expect(said).toContain('Alpha');
  });
});
