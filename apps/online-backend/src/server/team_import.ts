import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';
import {
  OTHER_IMPORT_MAX_LENGTH,
  ParsedTeamRow,
  TeamTsvProblem,
  TeamTsvProblemCode,
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
  /** Teams written. Zero whenever the file was refused — the rows that are
   * written are written together or not at all. */
  imported: number;
  /** Rows naming a team that is already there, which are left exactly as they
   * are: not written again, and not counted in `imported`. */
  accepted: number;
  /** The file was not loaded and nothing was written. Distinguishes a refusal
   * from the two other ways `imported` can be zero — a dry run, and a file
   * whose every team is already there. */
  refused: boolean;
  /** Data rows the file held, blank lines excluded. */
  rows: number;
  /** Errors first, then warnings, each in the order of the file. */
  problems: TeamTsvProblem[];
  /** Problems past the caps, which are not in `problems`. */
  problemsTruncated: number;
  /** How many warnings of each code the file drew, counted before any cap, so
   * a caller collapsing repeats into one line can label it with the file's own
   * number rather than with what happened to fit. */
  warningCounts: Partial<Record<TeamTsvProblemCode, number>>;
  /** Data rows holding at least one error — the rows that refused the file.
   * Counted before the cap, so it stays the file's own number when `problems`
   * is truncated and a caller cannot recover it from the list. */
  badRows: number;
  /** The teams of a load that wrote something, in the file's own order and in
   * `TEAM_IMPORT_HEADER` order, with the generated cells filled in — so one
   * upload of a whole list yields one file to mail out rather than a new one to
   * splice onto the last. Empty unless `imported` is non-zero: with nothing
   * written there are no new codes, and handing back the uploaded file is not
   * worth a download.
   *
   * It carries an accepted team only where the *file* already supplied that
   * team's join code. The codes this app holds are deliberately not read back
   * into it: no screen here shows a join code, and the import tab is not the
   * place to become the first. */
  exportTable: string[][];
}

// A file wrong in every row would otherwise answer with thousands of problems.
// Nobody reads past the first few before fixing the file and trying again.
const MAX_PROBLEMS = 200;

// And no single kind of warning may fill that list. Two of them are one per row
// by nature — `already-exists` on a re-import, `other-missing` on a file with no
// `Other` column — and under a flat cap either would bury `other-truncated`,
// the one warning that says a value was changed on its way in. Warnings only:
// the errors are why a file was refused and are all worth listing, and
// `badRows` reports their true scale regardless.
const MAX_PER_WARNING_CODE = 20;

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

/** Thrown when the draws run out, so the caller can say which server fault it
 * was rather than answer an unexplained 500. It is not one of the problems an
 * `ImportResult` carries: those are what is wrong with the *file*, and an
 * organiser can act on every one of them. This is a broken generator, which
 * they can do nothing about and which no file of theirs caused. */
export class CouldNotGenerate extends Error {
  constructor(readonly what: string) {
    super(`Could not generate an unused ${what} in ${MAX_DRAWS} tries.`);
  }
}

/** Draws until the value is one nobody holds. */
function draw(generate: () => string, taken: Set<string>, what: string): string {
  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    const value = generate();
    if (!taken.has(value)) return value;
  }
  throw new CouldNotGenerate(what);
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
  counts: { imported: number, accepted: number, rows: number },
  problems: TeamTsvProblem[],
  exportTable: string[][],
): ImportResult {
  // Errors first: they are why the file was refused, and a file with no `Other`
  // column would otherwise bury them under a warning per row.
  //
  // By line within each, because the clashes with live teams are found only
  // after the whole file is parsed: without the sort, a taken team name on
  // line 2 would be listed below a bad category on line 500. The sort is
  // stable, so two problems on one line keep the order the rules ran in, and
  // `row: 0` — the file as a whole — comes first.
  const byLine = (severity: TeamTsvProblem['severity']) =>
    problems.filter(problem => problem.severity === severity).sort((a, b) => a.row - b.row);
  const errors = byLine('error');
  const warnings = byLine('warning');

  const warningCounts: Partial<Record<TeamTsvProblemCode, number>> = {};
  for (const warning of warnings) {
    warningCounts[warning.code] = (warningCounts[warning.code] ?? 0) + 1;
  }

  // Each code keeps its first few and no more, so one warning per row cannot
  // push a rarer one off the end. What is dropped here is still counted in
  // `warningCounts` and in `problemsTruncated`.
  const listedPerCode = new Map<TeamTsvProblemCode, number>();
  const keptWarnings = warnings.filter(warning => {
    const listed = listedPerCode.get(warning.code) ?? 0;
    if (listed >= MAX_PER_WARNING_CODE) return false;
    listedPerCode.set(warning.code, listed + 1);
    return true;
  });

  const listed = [...errors, ...keptWarnings].slice(0, MAX_PROBLEMS);
  // Rows, not problems: one row can break several rules at once, and `row: 0`
  // — the file as a whole — is no row at all. Counted from every problem
  // rather than from the list above, so the caps decide what is listed and
  // not what is reported.
  const badRows = new Set(errors.filter(problem => problem.row !== 0).map(problem => problem.row)).size;
  return {
    imported: counts.imported,
    accepted: counts.accepted,
    refused: errors.length > 0,
    rows: counts.rows,
    problems: listed,
    problemsTruncated: errors.length + warnings.length - listed.length,
    badRows,
    warningCounts,
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

  // A file can be well-formed and still name teams the database knows about.
  // The unique constraints would catch those, but only as a constraint name and
  // only after the rows before them were written.
  const live = await teams.liveTeams();
  const byName = new Map(live.map(team => [team.teamName, team]));
  const taken: TakenIdentifiers = {
    teamIds: new Set(live.map(team => team.teamId)),
    teamNames: new Set(live.map(team => team.teamName)),
    joinCodes: new Set(live.map(team => team.joinCode)),
  };

  const accepted = new Set<number>();
  for (const row of parsed.rows) {
    const existing = byName.get(row.teamname);
    // Identity is the team name: it is the one identifier every row carries,
    // since a blank one is already an error. The other two only have to
    // corroborate it — supplied, they must be this team's own; blank, the row
    // is not asking for anything in particular.
    if (
      existing !== undefined
      && (row.teamId === '' || row.teamId === existing.teamId)
      && (row.joinCode === '' || row.joinCode === existing.joinCode)
    ) {
      accepted.add(row.row);
      problems.push({
        row: row.row, column: 'Teamname', severity: 'warning', code: 'already-exists', found: row.teamname,
      });
      // Said rather than silently ignored: an organiser who fixed a category in
      // the file and re-uploaded it has to learn that the fix did not land, or
      // the team plays the wrong games all round. `other` is deliberately not
      // compared — the admin routes append an audit trail to it, so it diverges
      // from the file in the normal course of a competition.
      if (row.category !== existing.category) {
        problems.push({
          row: row.row, column: 'Category', severity: 'warning', code: 'category-differs',
          found: `${row.category} ≠ ${existing.category}`,
        });
      }
      if (row.email !== existing.email) {
        problems.push({
          row: row.row, column: 'Email', severity: 'warning', code: 'email-differs',
          found: `${row.email} ≠ ${existing.email}`,
        });
      }
      continue;
    }
    // Not that team, so anything it shares with a live one is a clash. An
    // accepted row cannot reach here, which is why these stay exactly as they
    // were: whichever identifier collides names itself.
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

  const counts = { imported: 0, accepted: accepted.size, rows: parsed.dataLines };
  const hasError = problems.some(problem => problem.severity === 'error');
  if (hasError || options.dryRun) {
    return finish(counts, problems, []);
  }

  const filled = parsed.rows
    .filter(row => !accepted.has(row.row))
    .map(row => ({ row: row.row, team: fill(row, taken) }));
  // Every team in the file is already there, so there is nothing to write and
  // nothing to mail: no transaction, and no export of the organiser's own file
  // handed back to them as though it were new codes.
  if (filled.length === 0) {
    return finish(counts, problems, []);
  }

  const refused = await teams.insertTeams(filled);
  if (refused) {
    // The checks above missed it — a team added between the read and the write,
    // or a rule only the database has. Nothing was written.
    problems.push({
      row: refused.failedRow,
      severity: 'error',
      code: 'database-refused',
      // `errors` is what sequelize's own validators fill in. A constraint the
      // database itself refused can arrive with it empty — `UniqueConstraintError`
      // defaults it to `[]` — and a refusal quoting nothing leaves the admin with
      // a row number and no reason.
      found: refused.error.errors.map(item => item.message).join(' ') || refused.error.message,
    });
    return finish(counts, problems, []);
  }

  // In the file's own order, and carrying the accepted teams the file already
  // had codes for, so one upload of a whole list gives back one complete file.
  const written = new Map(filled.map(({ row, team }) => [row, team]));
  const exportTable = parsed.rows.flatMap(row => {
    const team = written.get(row.row);
    if (team !== undefined) return [exportRow(team)];
    // An accepted team whose code the file did not carry: leaving it out keeps
    // this download to what the organiser already held plus what was just made.
    return row.joinCode === '' ? [] : [exportRow(row)];
  });
  return finish({ ...counts, imported: filled.length }, problems, exportTable);
}

/** The problems in English, for the command line. The admin page words the same
 * codes in Hungarian; neither wording belongs in the shared parser. */
function describe(problem: TeamTsvProblem): string {
  const where = problem.row === 0 ? 'file' : `line ${problem.row}`;
  const column = problem.column === undefined ? '' : `, column "${problem.column}"`;
  const found = problem.found === undefined ? '' : `: ${problem.found}`;
  const said: Record<TeamTsvProblem['code'], string> = {
    'header-mismatch': 'header is not the one we define; the first line is read as one all the same, and not imported',
    'missing-header': 'the first line is a team, not a header, so the file has none — add the header row',
    'no-rows': 'no team rows',
    'wrong-column-count': 'more columns than the format has, so the row is not what it looks like',
    'empty-teamname': 'no team name',
    'teamname-too-long': 'team name is too long',
    'invalid-category': 'category is not C, D or E',
    'email-too-long': 'email is too long',
    'other-missing': '"Other" is empty; it is what identifies a team later — names, school, addresses',
    'other-truncated':
      `"Other" is longer than the import keeps and was cut to ${OTHER_IMPORT_MAX_LENGTH} characters`,
    'other-too-long': '"Other" is longer than the column holds',
    'invalid-team-id': 'ID is not a UUIDv4',
    'invalid-join-code': 'login code is not in the 111-2222-333 shape',
    'invalid-credentials': 'credentials are not a UUID',
    'duplicate-teamname': 'team name is used twice in this file',
    'duplicate-team-id': 'ID is used twice in this file',
    'duplicate-join-code': 'login code is used twice in this file',
    'teamname-taken': 'a team of this name already exists',
    'team-id-taken': 'a team with this ID already exists',
    'join-code-taken': 'a team with this login code already exists',
    'already-exists': 'this team is already there and was left as it is, not imported again',
    'category-differs': 'the team is already there with a different category (file, then live); it was not changed',
    'email-differs': 'the team is already there with a different email (file, then live); it was not changed',
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
 *
 * Answers whether it imported, which `import_teams.js` turns into its exit
 * code: a refused file finishes this function normally, and a shell that reads
 * only the status would take it for a load that worked.
 */
export async function import_teams_from_tsv_locally(
  teams: TeamsRepository, filename: string,
): Promise<boolean> {
  await teams.connect();
  const result = await importTeamsFromTsv(teams, readFileSync(filename, 'utf-8'));

  for (const problem of result.problems) {
    console[problem.severity === 'error' ? 'error' : 'warn'](describe(problem));
  }
  if (result.problemsTruncated > 0) {
    console.error(`... and ${result.problemsTruncated} more.`);
  }

  const exportFile = `${filename}.export`;
  console.info('Summary:');
  if (result.refused) {
    console.error(`Imported nothing. The file has ${result.rows} rows; fix the errors above and run it again.`);
    // Nothing was written, so an export from an earlier run is still lying
    // there with that run's join codes — the file DEPLOYMENT.md has organisers
    // fetch back off the host and mail out. Said rather than deleted: it is
    // the only copy of those codes, and the earlier import that made them is
    // still good.
    if (existsSync(exportFile)) {
      console.error(`${exportFile} is from an earlier run and was not rewritten; do not mail it out as this file's.`);
    }
    return false;
  }
  if (result.imported === 0) {
    // Not a failure: every team in the file is already there. Re-running a file
    // is how late teams are added, so this is the ordinary answer to running one
    // that has not grown since. The export is left alone — there are no new
    // codes, and rewriting it with the uploaded file would lose the last run's.
    console.info(`Nothing to import: all ${result.accepted} teams in the file are already there.`);
    return true;
  }
  console.info(`Successfully imported ${result.imported} teams.`);
  if (result.accepted > 0) {
    console.info(`${result.accepted} more were already there and were left as they are.`);
  }
  const exportTsv = teamsToImportTsv(result.exportTable);
  try {
    writeFileSync(exportFile, exportTsv, { encoding: 'utf-8' });
    console.info(`Their login codes are in ${exportFile}`);
  } catch (e: unknown) {
    // The teams are committed, and `teamName` is unique, so the file cannot be
    // run again to make the codes a second time. Throwing out of here would
    // exit 1 — which now says "imported nothing", sending the operator to do
    // exactly that — so the failure is reported and the codes printed instead,
    // as the only copy left of them.
    console.error(`Could not write ${exportFile}: ${e instanceof Error ? e.message : String(e)}`);
    console.error('The teams ARE imported; running this file again will not work. '
      + 'Their login codes follow — save them before this output scrolls away.');
    console.info(exportTsv);
  }
  return true;
}
