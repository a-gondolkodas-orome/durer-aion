import { describe, expect, test } from 'vitest';
import { DeletedTeamDto } from '../dto/TeamStateDto';
import { IMPORT_HEADER, batchesOf, deletedTeamsToImportTsv } from './deleted-teams';

const archived = (deletionId: number, teamName: string, deletedAt: string): DeletedTeamDto => ({
  deletionId,
  deletedAt,
  teamId: `0000000${deletionId}-0000-4000-8000-000000000000`,
  joinCode: `00${deletionId}-0000-000`,
  teamName,
  category: 'C',
  credentials: '1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b',
  email: 'team@example.com',
  other: 'Budapest',
  pageState: 'HOME',
  relayMatch: { state: 'NOT STARTED' },
  strategyMatch: { state: 'NOT STARTED' },
});

describe('batchesOf', () => {
  test('groups the rows that share a deletedAt, keeping the server\'s order', () => {
    const later = '2026-09-07T10:00:00.123Z';
    const earlier = '2026-09-07T09:00:00.456Z';

    const batches = batchesOf([archived(3, 'Charlie', later), archived(1, 'Alpha', earlier), archived(2, 'Bravo', earlier)]);

    expect(batches.map(batch => [batch.deletedAt, batch.teams.map(team => team.teamName)])).toStrictEqual([
      [later, ['Charlie']],
      [earlier, ['Alpha', 'Bravo']],
    ]);
  });

  test('has no batches for an empty archive', () => {
    expect(batchesOf([])).toStrictEqual([]);
  });
});

describe('deletedTeamsToImportTsv', () => {
  // The header is the one the backend's import checks the file against, so
  // the download re-imports without a warning.
  test('writes the import\'s header and one row per team, in its column order', () => {
    const tsv = deletedTeamsToImportTsv([archived(1, 'Alpha', '2026-09-07T09:00:00.456Z')]);

    expect(tsv.split('\n')).toStrictEqual([
      IMPORT_HEADER.join('\t'),
      ['Alpha', 'C', 'team@example.com', 'Budapest', '00000001-0000-4000-8000-000000000000', '001-0000-000', '1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b'].join('\t'),
      '',
    ]);
    expect(IMPORT_HEADER).toStrictEqual(['Teamname', 'Category', 'Email', 'Other', 'ID', 'Login Code', 'Credentials']);
  });

  // The import splits on tabs and newlines without quoting, so a cell holding
  // either would shift the columns after it.
  test('keeps a tab or a line break inside a cell from breaking the row', () => {
    const team = { ...archived(1, 'Al\tpha', '2026-09-07T09:00:00.456Z'), other: 'two\nlines' };

    const [, row] = deletedTeamsToImportTsv([team]).split('\n');

    expect(row.split('\t')).toHaveLength(IMPORT_HEADER.length);
    expect(row.startsWith('Al pha\tC\tteam@example.com\ttwo lines\t')).toBe(true);
  });
});
