import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TEAM_IMPORT_HEADER, teamsToImportTsv } from 'schemas';
import { TeamModel } from './model';
import { importTeamsFromTsv } from './team_import';
import { startTestDatabase } from './test_database';

// The import against a real postgres (test_database.ts), for what only the
// database decides: that the transaction really rolls back, and that a file the
// pre-pass accepts is one the model's validators and unique constraints accept
// too. team_import.test.ts stubs the repository for everything else.

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

const fixture = (name: string) =>
  readFileSync(join(__dirname, '..', '..', '..', '..', 'scripts', name), 'utf-8');

const row = (teamname: string, rest: string[] = []) =>
  [teamname, 'C', 'a@b.com', 'Kovács Anna — Példa Gimnázium', ...rest].join('\t');
const file = (...rows: string[]) => [TEAM_IMPORT_HEADER.join('\t'), ...rows].join('\n');

const teamNames = async () => (await TeamModel.findAll({ order: [['teamName', 'ASC']] })).map(team => team.teamName);

describe('importTeamsFromTsv against postgres', () => {
  it('writes the teams with the codes it hands back, accents and all', async () => {
    const result = await importTeamsFromTsv(database.teams, file(row('Álmos'), row('Bravo')));

    expect(result.imported).toBe(2);
    const [first] = result.exportTable;
    const stored = await database.teams.getTeam({ joinCode: first[5] });
    expect(stored).toMatchObject({
      teamName: 'Álmos', other: 'Kovács Anna — Példa Gimnázium',
      teamId: first[4], credentials: first[6], pageState: 'DISCLAIMER',
      relayMatchID: null, strategyMatchID: null,
    });
  });

  it('accepts its own export fed straight back, and writes nothing', async () => {
    const first = await importTeamsFromTsv(database.teams, file(row('Alpha'), row('Bravo')));

    const again = await importTeamsFromTsv(database.teams, teamsToImportTsv(first.exportTable));

    expect(again).toMatchObject({ refused: false, imported: 0, accepted: 2 });
    expect(await TeamModel.count()).toBe(2);
  });

  it('adds the late teams of a grown list and leaves the rest as they are', async () => {
    const first = await importTeamsFromTsv(database.teams, file(row('Alpha')));
    const grown = `${teamsToImportTsv(first.exportTable)}${row('Bravo')}\n`;

    const again = await importTeamsFromTsv(database.teams, grown);

    expect(again).toMatchObject({ imported: 1, accepted: 1 });
    expect(again.exportTable.map(exported => exported[0])).toEqual(['Alpha', 'Bravo']);
    expect(await teamNames()).toEqual(['Alpha', 'Bravo']);
  });

  it('loads scripts/test.tsv whole: the fixture teams:import seeds a stack with', async () => {
    const result = await importTeamsFromTsv(database.teams, fixture('test.tsv'));

    expect(result.problems.filter(problem => problem.severity === 'error')).toEqual([]);
    expect(result.imported).toBe(result.rows);
    expect(await TeamModel.count()).toBe(result.rows);
  }, 30_000);

  it('refuses scripts/unit_test.tsv and writes none of it', async () => {
    const result = await importTeamsFromTsv(database.teams, fixture('unit_test.tsv'));

    expect(result.refused).toBe(true);
    // One of each the team names promise, so the fixture holds the cases the
    // README says it does.
    expect(new Set(result.problems.map(problem => problem.code))).toEqual(new Set([
      'duplicate-teamname', 'duplicate-team-id', 'duplicate-join-code', 'duplicate-credentials',
      'invalid-category', 'invalid-team-id', 'invalid-join-code', 'other-missing', 'other-truncated',
    ]));
    expect(await TeamModel.count()).toBe(0);
  });
});

describe('TeamsRepository.insertTeams', () => {
  const team = (teamname: string, n: string, credentials = `67676767-6767-4767-a767-676767676${n}`) => ({
    teamname, category: 'C', email: '', other: '',
    teamId: `8eae8669-125c-42e5-8b49-89afbac31${n}`, joinCode: `111-2222-${n}`, credentials,
  });

  // What the import's own checks cannot see: a team that landed between its
  // read of the live teams and this write. The rows before the clash are
  // rolled back with it, so the file can be fixed and run again.
  it('writes no row of a batch the database refuses one row of', async () => {
    await database.teams.insertTeam(team('Live', '001'));

    const refused = await database.teams.insertTeams([
      { row: 2, team: team('Alpha', '002') },
      { row: 3, team: team('Bravo', '003', team('Live', '001').credentials) },
    ]);

    expect(refused?.failedRow).toBe(3);
    expect(refused?.error.errors.map(item => item.message)).toEqual(['Credentials already exist.']);
    expect(await teamNames()).toEqual(['Live']);
  });
});
