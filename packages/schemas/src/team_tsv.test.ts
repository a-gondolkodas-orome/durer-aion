import { describe, expect, it } from 'vitest';
import {
  OTHER_MAX_LENGTH,
  TEAMNAME_MAX_LENGTH,
  TEAM_IMPORT_HEADER,
  parseTeamsTsv,
  teamsToImportTsv,
} from './team_tsv';

const HEADER = TEAM_IMPORT_HEADER.join('\t');

/** A row that passes every rule, so a test can break exactly one thing. */
const row = (fields: Partial<Record<'teamname' | 'category' | 'email' | 'other'
  | 'teamId' | 'joinCode' | 'credentials', string>> = {}) => [
  fields.teamname ?? 'Alpha',
  fields.category ?? 'C',
  fields.email ?? 'alpha@example.com',
  fields.other ?? 'Kovács Anna, Szabó Béla — Példa Gimnázium',
  fields.teamId ?? '',
  fields.joinCode ?? '',
  fields.credentials ?? '',
].join('\t');

const file = (...rows: string[]) => [HEADER, ...rows].join('\n');

const codes = (content: string) => parseTeamsTsv(content).problems.map(problem => problem.code);

describe('parseTeamsTsv', () => {
  it('accepts a file whose cells are all blank but the first four', () => {
    const result = parseTeamsTsv(file(row()));

    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The blanks stay blank: generating them is the server's job.
    expect(result.rows).toEqual([{
      row: 2,
      teamname: 'Alpha',
      category: 'C',
      email: 'alpha@example.com',
      other: 'Kovács Anna, Szabó Béla — Példa Gimnázium',
      teamId: '',
      joinCode: '',
      credentials: '',
    }]);
  });

  it('reports a mismatched header exactly once, as a warning', () => {
    // Two columns swapped and one renamed — three complaints if each were its
    // own problem, which is what this pins against.
    const content = ['Teamname\tEmail\tCategory\tNotes\tID\tLogin Code\tCredentials', row()].join('\n');
    const result = parseTeamsTsv(content);

    const headerProblems = result.problems.filter(problem => problem.code === 'header-mismatch');
    expect(headerProblems).toHaveLength(1);
    expect(headerProblems[0].severity).toBe('warning');
    expect(headerProblems[0].row).toBe(1);
    // A warning only: the importer reads by position, so the file still loads.
    expect(result.ok).toBe(true);
  });

  it('numbers problems by the line of the file, header included', () => {
    const content = file(row(), row({ teamname: 'Bravo', category: 'X' }));
    const [problem] = parseTeamsTsv(content).problems;

    expect(problem.code).toBe('invalid-category');
    expect(problem.row).toBe(3);
    expect(problem.column).toBe('Category');
  });

  it('strips the carriage return of a CRLF file', () => {
    const content = [HEADER, row(), ''].join('\r\n');
    const result = parseTeamsTsv(content);

    expect(result.problems).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].credentials).toBe('');
  });

  it('skips blank lines without counting them as rows or as mistakes', () => {
    const result = parseTeamsTsv(file(row(), '', row({ teamname: 'Bravo' }), ''));

    expect(result.problems).toEqual([]);
    expect(result.rows.map(parsed => parsed.teamname)).toEqual(['Alpha', 'Bravo']);
    // The line numbers still point at the file, so the blank line is not
    // silently closed up.
    expect(result.rows.map(parsed => parsed.row)).toEqual([2, 4]);
  });

  it('rejects a file with no data rows', () => {
    expect(codes(HEADER)).toEqual(['no-rows']);
    expect(parseTeamsTsv(HEADER).ok).toBe(false);
  });

  it('rejects a row carrying more columns than the format has', () => {
    // A tab inside the "Other" field, which shifts every column after it.
    const content = file(`${row()}\textra`);
    const result = parseTeamsTsv(content);

    expect(result.problems[0].code).toBe('wrong-column-count');
    // The shifted values are not read at all, so no second complaint about them.
    expect(result.problems).toHaveLength(2);
    expect(result.problems[1].code).toBe('no-rows');
  });

  describe('the cells', () => {
    it('rejects an empty team name', () => {
      expect(codes(file(row({ teamname: '' })))).toEqual(['empty-teamname']);
    });

    it('takes a team name of 255 characters and refuses 256', () => {
      expect(codes(file(row({ teamname: 'a'.repeat(TEAMNAME_MAX_LENGTH) })))).toEqual([]);
      expect(codes(file(row({ teamname: 'a'.repeat(TEAMNAME_MAX_LENGTH + 1) })))).toEqual(['teamname-too-long']);
    });

    it('rejects a category outside C, D and E', () => {
      for (const category of ['C', 'D', 'E']) {
        expect(codes(file(row({ category })))).toEqual([]);
      }
      expect(codes(file(row({ category: 'F' })))).toEqual(['invalid-category']);
      expect(codes(file(row({ category: 'c' })))).toEqual(['invalid-category']);
      expect(codes(file(row({ category: '' })))).toEqual(['invalid-category']);
    });

    it('takes an "Other" field of 700 characters and refuses 701', () => {
      expect(codes(file(row({ other: 'a'.repeat(OTHER_MAX_LENGTH) })))).toEqual([]);
      expect(codes(file(row({ other: 'a'.repeat(OTHER_MAX_LENGTH + 1) })))).toEqual(['other-too-long']);
    });

    it('warns, without failing, when "Other" is empty', () => {
      const result = parseTeamsTsv(file(row({ other: '' })));

      expect(result.problems.map(problem => problem.code)).toEqual(['other-missing']);
      expect(result.problems[0].severity).toBe('warning');
      expect(result.ok).toBe(true);
    });
  });

  // The checks PR #100 dropped: a supplied identifier used to be checked for
  // shape, and without that a file passes here and is refused by the database
  // partway through the import.
  describe('a supplied identifier', () => {
    const teamId = '20638d0e-ac06-4e72-a734-b4fcdcaee425';
    const credentials = 'a5303260-816d-4474-9024-42090672d74d';

    it('accepts a well-formed id, join code and credentials', () => {
      expect(codes(file(row({ teamId, joinCode: '692-2481-797', credentials })))).toEqual([]);
    });

    it('rejects an id that is not a UUIDv4', () => {
      expect(codes(file(row({ teamId: '77777777-7777-7777-7777-777777777777' })))).toEqual(['invalid-team-id']);
      expect(codes(file(row({ teamId: 'not-a-uuid' })))).toEqual(['invalid-team-id']);
    });

    it('rejects a join code outside the NNN-NNNN-NNN shape', () => {
      expect(codes(file(row({ joinCode: '69-2481-797' })))).toEqual(['invalid-join-code']);
      expect(codes(file(row({ joinCode: '692 2481 797' })))).toEqual(['invalid-join-code']);
    });

    it('rejects credentials that are not a UUID', () => {
      expect(codes(file(row({ credentials: 'a5303260-816d-4474-9024' })))).toEqual(['invalid-credentials']);
    });

    it('catches a shifted row through the columns it lands in', () => {
      // One tab missing after the team name, so every later cell is one column
      // to the left and the identifiers are read out of the wrong fields.
      const shifted = ['Alpha\tC\talpha@example.com', teamId, '692-2481-797', credentials].join('\t');

      expect(codes(file(shifted))).toContain('invalid-team-id');
    });
  });

  describe('a value the file uses twice', () => {
    const first = '20638d0e-ac06-4e72-a734-b4fcdcaee425';
    const second = 'b5646f04-2591-4afc-9ae7-4350562c0649';

    it('names both lines for a duplicate team name', () => {
      const result = parseTeamsTsv(file(row(), row({ teamId: second })));

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0]).toMatchObject({
        code: 'duplicate-teamname', row: 3, otherRow: 2, found: 'Alpha',
      });
    });

    it('names both lines for a duplicate id', () => {
      const content = file(row({ teamId: first }), row({ teamname: 'Bravo', teamId: first }));

      expect(parseTeamsTsv(content).problems[0]).toMatchObject({
        code: 'duplicate-team-id', row: 3, otherRow: 2,
      });
    });

    it('names both lines for a duplicate join code', () => {
      const content = file(
        row({ joinCode: '111-2222-222' }),
        row({ teamname: 'Bravo', joinCode: '111-2222-222' }),
      );

      expect(parseTeamsTsv(content).problems[0]).toMatchObject({
        code: 'duplicate-join-code', row: 3, otherRow: 2,
      });
    });

    it('does not count blank identifiers as duplicates of each other', () => {
      // Every row leaves all three blank, which is the normal case.
      const content = file(row(), row({ teamname: 'Bravo' }), row({ teamname: 'Charlie' }));

      expect(codes(content)).toEqual([]);
    });
  });
});

describe('teamsToImportTsv', () => {
  it('writes the header and one line per team, ending in a newline', () => {
    const written = teamsToImportTsv([['Alpha', 'C', 'a@b.com', 'x', 'id', 'code', 'creds']]);

    expect(written).toBe(`${HEADER}\nAlpha\tC\ta@b.com\tx\tid\tcode\tcreds\n`);
  });

  it('scrubs tabs and newlines out of a cell, which would shift the columns', () => {
    const written = teamsToImportTsv([['Al\tpha', 'C', 'a@b.com', 'two\nlines', 'id', 'code', 'creds']]);

    expect(written).toContain('Al pha\tC');
    expect(written.trimEnd().split('\n')).toHaveLength(2);
  });

  it('round-trips through the parser', () => {
    const written = teamsToImportTsv([
      ['Alpha', 'C', 'a@b.com', 'x', '20638d0e-ac06-4e72-a734-b4fcdcaee425',
        '692-2481-797', 'a5303260-816d-4474-9024-42090672d74d'],
    ]);

    const result = parseTeamsTsv(written);
    expect(result.problems).toEqual([]);
    expect(result.rows[0].teamname).toBe('Alpha');
  });
});
