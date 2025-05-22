import { readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';
import { ValidationError } from 'sequelize';
import { TeamsRepository } from './db';

function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function randomDigits(numDigits: number) {
  var result = "";
  for (var i = 0; i < numDigits; i++) { result += `${randomInt(0, 10)}`; }
  return result;
}

function generateLoginCode() {
  return `${randomDigits(3)}-${randomDigits(4)}-${randomDigits(3)}`;
}
export async function import_teams_from_tsv_locally(teams: TeamsRepository, filename: string) {
  const expected_header = ["Teamname", "Category", "Email", "Other", "ID", "Login Code", "Credentials"];
  const { successful, failed, export_table, logs } = await import_teams_from_tsv(teams, filename);
  //wrap out logs
  for (let i = 0; i < logs.value.length; i++) {
    console[logs.sev[i]](logs.value[i]);
  }
  console.info("Summary:");
  console.info(`Successfully imported ${successful} teams, failed ${failed} times.`);
  // TODO: Move the file
  export_table.unshift(expected_header);
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
  const header = table.shift()!;
  const expected_header = ["Teamname", "Category", "Email", "Other", "ID", "Login Code", "Credentials"];
  if (!arraysEqual(header, expected_header)) {
    onwarn("WARNING: Header not exactly how we defined it. This is not always a problem.");
    onwarn(`Found: ${header.join(', ')}`);
    onwarn(`Expected: ${expected_header.join(', ')}`);
  }
  var export_table: string[][] = [];

  let successful = 0;
  let failed = 0; // not counting empty rows...
  await teams.connect();
  for (var row of table) {
    // Trim: Remove possible '\r' characters in windows CRLF
    const [teamname, category, email, other, ...extra_columns] = row.map(column => column.trim());
    let ok = true;
    let teamId = extra_columns[0];
    let login_code = extra_columns[1];
    let credentials = extra_columns[2];

    if (category === undefined) {
      onwarn('Skipping empty row...');
      // Do not print more error messages lol
      continue;
    }

    if (teamname === undefined || teamname === "") {
      onerror(`Empty teamname`);
      ok = false;
    }

    // TODO: remove hard-coded values
    if (!['C', 'D', 'E'].includes(category)) {
      onerror(`ERROR: Invalid category [${category}] for team ${teamname}.`);
      ok = false;
    }

    if (other === undefined || other === "") {
      onwarn(`"Other" field not set for team ${teamname}`);
      onwarn(`  The other field should include any info which could help identify a team. (team name, contestant names, school, email addresses, etc.)`);
    }
    //this is stricter than the modell definition, because other can increase it's size
    if (other !== undefined && other.length > 700) {
      onerror(`"Other" filed is too long (${other.length} to be exact, expecting < 700)`);
      ok = false;
    }

    if (teamId === undefined || teamId === "") {
      oninfo('Generating teamId')
      teamId = randomUUID();
    }

    if (login_code === undefined || login_code === "") {
      oninfo('Generating login code')
      login_code = generateLoginCode();
    }

    if (credentials === undefined || credentials === "") {
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
          console.log('We experienced an unexpected error during import. This type of error is not handled in the import scritp, please file a bug report in the GitHub repository!')
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
