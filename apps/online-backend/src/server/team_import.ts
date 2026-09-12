import { readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';
import {
  ParsedTeamRow,
  TeamTsvProblem,
  parseTeamsTsv,
  teamsToImportTsv,
} from 'schemas';
import { NewTeam, TakenIdentifiers, TeamsRepository } from './db';

/** What a caller gets back, whether the file loaded or was refused.
 *
 * There is no per-row log. The rows that worked are the export table, and
 * `imported` counts them; saying so again once per row was ~2 000 strings on a
 * 500-team file, which is the largest part of a response nobody reads.
 */
export interface ImportResult {
  /** Teams written. Zero whenever the file was refused — the import is
   * all-or-nothing, so there is no third case. */
  imported: number;
  /** Data rows the file held, blank lines excluded. */
  rows: number;
  /** Errors first, then warnings, each in the order of the file. */
  problems: TeamTsvProblem[];
  /** Problems past the cap, which are not in `problems`. */
  problemsTruncated: number;
  /** One row per imported team, in `TEAM_IMPORT_HEADER` order, with the
   * generated cells filled in. This is the only copy of the join codes the
   * import created. */
  exportTable: string[][];
}

// A file wrong in every row would otherwise answer with thousands of problems.
// Nobody reads past the first few before fixing the file and trying again.
const MAX_PROBLEMS = 200;

function randomDigits(numDigits: number) {
  let result = '';
  for (let i = 0; i < numDigits; i++) { result += `${randomInt(0, 10)}`; }
  return result;
}

function generateLoginCode() {
  return `${randomDigits(3)}-${randomDigits(4)}-${randomDigits(3)}`;
}

// Enough tries that exhausting them is a broken generator rather than bad luck:
// a join code is 1 in 10^10, so even a thousand teams make a single collision
// unlikely, let alone this many in a row. Bounded because the alternative is a
// loop that hangs the request instead of saying what is wrong.
const MAX_DRAWS = 100;

/** Draws until the value is one nobody holds. */
function draw(generate: () => string, taken: Set<string>, what: string): string {
  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    const value = generate();
    if (!taken.has(value)) return value;
  }
  throw new Error(`Could not generate an unused ${what} in ${MAX_DRAWS} tries.`);
}

/**
 * Fills the cells the file left blank.
 *
 * A generated value is checked against the ones in use rather than trusted: a
 * collision is rare, and rare is the bad case here, because it would abort the
 * whole import once, on a competition morning. `taken` is updated as it goes,
 * so two rows of the same file cannot be given the same code either.
 */
function fill(row: ParsedTeamRow, taken: TakenIdentifiers): NewTeam {
  const teamId = row.teamId === '' ? draw(randomUUID, taken.teamIds, 'team id') : row.teamId;
  taken.teamIds.add(teamId);

  const joinCode = row.joinCode === '' ? draw(generateLoginCode, taken.joinCodes, 'join code') : row.joinCode;
  taken.joinCodes.add(joinCode);

  return {
    teamname: row.teamname,
    category: row.category,
    email: row.email,
    other: row.other,
    teamId,
    joinCode,
    // Not checked against anything: `credentials` carries no unique constraint,
    // only a format (`model.ts`).
    credentials: row.credentials === '' ? randomUUID() : row.credentials,
  };
}

function exportRow(team: NewTeam): string[] {
  return [team.teamname, team.category, team.email, team.other, team.teamId, team.joinCode, team.credentials];
}

function finish(
  imported: number, rows: number, problems: TeamTsvProblem[], exportTable: string[][],
): ImportResult {
  // Errors first: they are why the file was refused, and a file with no `Other`
  // column would otherwise bury them under a warning per row.
  const ordered = [
    ...problems.filter(problem => problem.severity === 'error'),
    ...problems.filter(problem => problem.severity === 'warning'),
  ];
  return {
    imported,
    rows,
    problems: ordered.slice(0, MAX_PROBLEMS),
    problemsTruncated: Math.max(0, ordered.length - MAX_PROBLEMS),
    exportTable,
  };
}

/**
 * Loads a TSV of teams: parse, then every row or none.
 *
 * Takes the file's *content* rather than its name, so the HTTP route can hand
 * over a request body and no copy of it — join codes included — reaches disk.
 *
 * With `dryRun` it stops after the checks and writes nothing, which is how the
 * admin page can report the clashes with live teams that a check in the browser
 * cannot see.
 */
export async function importTeamsFromTsv(
  teams: TeamsRepository, content: string, options: { dryRun?: boolean } = {},
): Promise<ImportResult> {
  const parsed = parseTeamsTsv(content);
  const problems = [...parsed.problems];

  // A file can be well-formed and still name a team that exists. The unique
  // constraints would catch it, but only as a constraint name and only after
  // the rows before it were written.
  const taken = await teams.takenIdentifiers();
  for (const row of parsed.rows) {
    if (row.teamname !== '' && taken.teamNames.has(row.teamname)) {
      problems.push({ row: row.row, column: 'Teamname', severity: 'error', code: 'teamname-taken', found: row.teamname });
    }
    if (row.teamId !== '' && taken.teamIds.has(row.teamId)) {
      problems.push({ row: row.row, column: 'ID', severity: 'error', code: 'team-id-taken', found: row.teamId });
    }
    if (row.joinCode !== '' && taken.joinCodes.has(row.joinCode)) {
      problems.push({ row: row.row, column: 'Login Code', severity: 'error', code: 'join-code-taken', found: row.joinCode });
    }
  }

  const hasError = problems.some(problem => problem.severity === 'error');
  if (hasError || options.dryRun) {
    return finish(0, parsed.rows.length, problems, []);
  }

  const filled = parsed.rows.map(row => ({ row: row.row, team: fill(row, taken) }));
  const refused = await teams.insertTeams(filled);
  if (refused) {
    // The checks above missed it — a team added between the read and the write,
    // or a rule only the database has. Nothing was written.
    problems.push({
      row: refused.failedRow,
      severity: 'error',
      code: 'database-refused',
      found: refused.error.errors.map(item => item.message).join(' '),
    });
    return finish(0, parsed.rows.length, problems, []);
  }

  return finish(filled.length, parsed.rows.length, problems, filled.map(({ team }) => exportRow(team)));
}

/** The problems in English, for the command line. The admin page words the same
 * codes in Hungarian; neither wording belongs in the shared parser. */
function describe(problem: TeamTsvProblem): string {
  const where = problem.row === 0 ? 'file' : `line ${problem.row}`;
  const column = problem.column === undefined ? '' : `, column "${problem.column}"`;
  const found = problem.found === undefined ? '' : `: ${problem.found}`;
  const said: Record<TeamTsvProblem['code'], string> = {
    'header-mismatch': 'header is not the one we define, which is usually harmless',
    'no-rows': 'no team rows',
    'wrong-column-count': 'more columns than the format has, so the row is not what it looks like',
    'empty-teamname': 'no team name',
    'teamname-too-long': 'team name is too long',
    'invalid-category': 'category is not C, D or E',
    'email-too-long': 'email is too long',
    'other-missing': '"Other" is empty; it is what identifies a team later — names, school, addresses',
    'other-too-long': '"Other" is too long',
    'invalid-team-id': 'ID is not a UUIDv4',
    'invalid-join-code': 'login code is not in the 111-2222-333 shape',
    'invalid-credentials': 'credentials are not a UUID',
    'duplicate-teamname': 'team name is used twice in this file',
    'duplicate-team-id': 'ID is used twice in this file',
    'duplicate-join-code': 'login code is used twice in this file',
    'teamname-taken': 'a team of this name already exists',
    'team-id-taken': 'a team with this ID already exists',
    'join-code-taken': 'a team with this login code already exists',
    'database-refused': 'the database refused this row',
  };
  const first = problem.otherRow === undefined ? '' : ` (first used on line ${problem.otherRow})`;
  return `${where}${column}: ${said[problem.code]}${found}${first}`;
}

/**
 * The import as the command line runs it: read the file, load it, then write
 * `<file>.export` beside it — the copy of the generated join codes an organiser
 * mails out.
 *
 * `connect()` — a `sequelize.sync()` — is here rather than in the import
 * itself because this is the one caller that may be talking to a database no
 * server has opened yet (#190). On the HTTP path the server has already synced,
 * and doing it per request would put a schema change on an admin's click.
 */
export async function import_teams_from_tsv_locally(teams: TeamsRepository, filename: string) {
  await teams.connect();
  const result = await importTeamsFromTsv(teams, readFileSync(filename, 'utf-8'));

  for (const problem of result.problems) {
    console[problem.severity === 'error' ? 'error' : 'warn'](describe(problem));
  }
  if (result.problemsTruncated > 0) {
    console.error(`... and ${result.problemsTruncated} more.`);
  }

  console.info('Summary:');
  if (result.imported === 0) {
    console.info(`Imported nothing. The file has ${result.rows} rows; fix the errors above and run it again.`);
    return;
  }
  console.info(`Successfully imported ${result.imported} teams.`);
  writeFileSync(`${filename}.export`, teamsToImportTsv(result.exportTable), { encoding: 'utf-8' });
  console.info(`Their login codes are in ${filename}.export`);
}
