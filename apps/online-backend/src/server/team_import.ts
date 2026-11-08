import { readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';
import { ValidationError } from 'sequelize';
import { TeamsRepository } from './db';
import { OTHER_IMPORT_MAX_LENGTH } from './model';
import { isCompetitionCategory } from 'schemas';

// The importer's columns, in the order the export writes them. A file may hold
// them in any order: each is found by its header, whatever its case.
const COLUMNS = ["Teamname", "Category", "Email", "Other", "ID", "Login Code", "Credentials"] as const;
type Column = typeof COLUMNS[number];
const REQUIRED: readonly Column[] = ["Teamname", "Category"];

const headerKey = (cell: string) => cell.trim().toLowerCase();

/** Where each known column is in the file, or the reason the header cannot be
 * read. A column the header does not name reads as blank. */
function readHeader(header: string[]):
  { positions: Partial<Record<Column, number>>, unknown: string[] } | { refused: string } {
  const positions: Partial<Record<Column, number>> = {};
  const unknown: string[] = [];
  header.forEach((cell, index) => {
    const column = COLUMNS.find(name => headerKey(name) === headerKey(cell));
    if (column === undefined) {
      if (cell.trim() !== '') unknown.push(cell.trim());
    } else if (positions[column] !== undefined) {
      positions[column] = -1;
    } else {
      positions[column] = index;
    }
  });
  const twice = COLUMNS.filter(column => positions[column] === -1);
  if (twice.length > 0) {
    return { refused: `The header names ${twice.join(', ')} more than once.` };
  }
  const missing = REQUIRED.filter(column => positions[column] === undefined);
  if (missing.length > 0) {
    // A first line holding a team rather than a header lands here too, which
    // is the point: read as a header, it would drop that team in silence.
    return { refused: `The first line must be the header, naming at least ${REQUIRED.join(' and ')}; `
      + `it names no ${missing.join(' and no ')}.` };
  }
  return { positions, unknown };
}

function randomDigits(numDigits: number) {
  let result = "";
  for (let i = 0; i < numDigits; i++) { result += `${randomInt(0, 10)}`; }
  return result;
}

function generateLoginCode() {
  return `${randomDigits(3)}-${randomDigits(4)}-${randomDigits(3)}`;
}
export async function import_teams_from_tsv_locally(teams: TeamsRepository, filename: string) {
  const { successful, failed, export_table, logs } = await import_teams_from_tsv(teams, filename);
  for (let i = 0; i < logs.value.length; i++) {
    console[logs.sev[i]](logs.value[i]);
  }
  console.info("Summary:");
  console.info(`Successfully imported ${successful} teams, failed ${failed} times.`);
  export_table.unshift([...COLUMNS]);
  writeFileSync(`${filename}.export`, export_table.map(row => row.join('\t')).join('\n'), { 'encoding': 'utf-8' });
}

export async function import_teams_from_tsv(teams: TeamsRepository, filename: string) {
  const logs: {
    sev: ('info' | 'warn' | 'error')[];
    value: string[];
  } = {
    sev: [],
    value: [],
  };

  function oninfo(msg: string) { logs.value.push(msg); logs.sev.push('info') }
  function onwarn(msg: string) { logs.value.push(msg); logs.sev.push('warn') }
  function onerror(msg: string) { logs.value.push(msg); logs.sev.push('error') }


  oninfo("Importing teams.");
  oninfo("  Use a .tsv file (UTF-8 format, no quoted strings, no tab characters)");
  const untrimmed_rows = readFileSync(filename, 'utf-8').split('\n');
  const rows = untrimmed_rows;
  if (rows[rows.length - 1].trim() === "") {
    rows.pop();
  }
  const table = rows.map(row => row.split('\t'));
  const header = table.shift() ?? [];
  const export_table: string[][] = [];
  const read = readHeader(header);
  if ('refused' in read) {
    onerror(`Imported nothing. ${read.refused}`);
    onerror(`Found: ${header.map(cell => cell.trim()).join(', ')}`);
    onerror('Columns, in any order: Teamname and Category (required); Email, Other, ID, Login Code and '
      + 'Credentials (optional, the last three generated when left out or blank).');
    if (header.length === 1) {
      onerror('The header has no tab in it: the columns must be separated by tabs, not spaces.');
    }
    return { successful: 0, failed: 0, export_table, logs };
  }
  if (read.unknown.length > 0) {
    onwarn(`Ignoring the columns this import does not know: ${read.unknown.join(', ')}`);
  }
  const { positions } = read;

  let successful = 0;
  let failed = 0; // not counting blank lines
  await teams.connect();
  for (const row of table) {
    // A blank line is what an editor leaves between blocks or at the end.
    if (row.every(column => column.trim() === '')) {
      continue;
    }
    // A line with text and no tab is not a row with blank columns: it is a
    // file separated by spaces, which cannot be split safely — a team name
    // holds spaces of its own.
    if (row.length === 1) {
      onerror(`No tab in the row "${row[0].trim()}": the columns must be separated by tabs, not spaces.`);
      onerror('-----------------------------------------------------'); // separate errors
      failed++;
      continue;
    }
    // Trim: Remove possible '\r' characters in windows CRLF. A column the
    // header leaves out, or a row ending before it, reads as blank, so a team
    // with no Email or Other is stored with empty strings.
    const cell = (column: Column) => {
      const position = positions[column];
      return position === undefined ? '' : (row[position] ?? '').trim();
    };
    const teamname = cell("Teamname");
    const category = cell("Category");
    const email = cell("Email");
    const other = cell("Other");
    let ok = true;
    let teamId = cell("ID");
    let login_code = cell("Login Code");
    let credentials = cell("Credentials");


    if (teamname === "") {
      onerror(`Empty teamname`);
      ok = false;
    }

    if (!isCompetitionCategory(category)) {
      onerror(`ERROR: Invalid category [${category}] for team ${teamname}.`);
      ok = false;
    }

    // Stricter than the column, on purpose: the admin routes append an audit
    // trail to this field, and `model.ts` says what the gap is for.
    if (other.length > OTHER_IMPORT_MAX_LENGTH) {
      onerror(`"Other" filed is too long (${other.length} to be exact, expecting < ${OTHER_IMPORT_MAX_LENGTH})`);
      ok = false;
    }

    if (teamId === "") {
      oninfo('Generating teamId')
      teamId = randomUUID();
    }

    if (login_code === "") {
      oninfo('Generating login code')
      login_code = generateLoginCode();
    }

    if (credentials === "") {
      oninfo('Generating credentials')
      credentials = randomUUID();
    }

    if (ok) {
      oninfo(`Adding ${teamname} to DB.`);
      try {
        await teams.insertTeam({ teamname, category, email, other, teamId, joinCode: login_code, credentials });
      } catch (err) {
        if (err instanceof ValidationError) {
          onerror(`Failed to validate team when adding to DB: ${err.errors.map(e => e.message).join(', ')}`);
          ok = false;
        } else {
          console.log('We experienced an unexpected error during import. This type of error is not handled in the import script, please file a bug report in the GitHub repository!')
          throw err;
        }
      }
    }

    if (ok) {
      oninfo(`Successfully imported team ${teamname}.`);
      const row_to_export = [teamname, category, email, other, teamId, login_code, credentials];
      export_table.push(row_to_export);
      successful++;
    } else {
      onerror(`Failed to import team ${teamname}. See reasons above.`);
      onerror('-----------------------------------------------------'); // separate errors
      failed++;
    }
  }

  return { successful, failed, export_table, logs };
}
