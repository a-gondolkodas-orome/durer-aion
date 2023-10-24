import { readFileSync, renameSync, writeFileSync } from 'fs';
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

function generateLoginCode() {
  return `${randomInt(1, 1000)}-${randomInt(1, 10000)}-${randomInt(1, 1000)}`;
}

export async function importer(teams: TeamsRepository, filename: string) {
  console.info("Importing teams.");
  console.info("  Use a .tsv file (UTF-8 format, no quoted strings, no tab characters)");
  const untrimmed_rows = readFileSync(filename, 'utf-8').split('\n');
  const rows = untrimmed_rows;
  if (rows[rows.length - 1].trim() === "") {
    rows.pop();
  }
  const table = rows.map(row => row.split('\t'));
  const header = table.shift()!;
  const expected_header = ["Teamname", "Category", "Email", "Other", "ID", "Login Code", "Credentials"];
  if (!arraysEqual(header, expected_header)) {
    console.warn("WARNING: Header not exactly how we defined it. This is not always a problem.");
    console.warn(`Found: ${header.join(', ')}`);
    console.warn(`Expected: ${expected_header.join(', ')}`);
  }
  var export_table : string[][] = [];
  var found_teamNames = new Set();
  var found_ids = new Set();
  var found_login_codes = new Set();
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
      console.warn('Skipping empty row...');
      // Do not print more error messages lol
      continue;
    }

    if (teamname === undefined || teamname === "") {
      console.error(`Empty teamname`);
      ok = false;
    }

    if (found_teamNames.has(teamname)) {
      console.error('Duplicate team name');
      ok = false;
    } else {
      found_teamNames.add(teamname);
    }

    // TODO: hard-coded values
    if (!['C', 'D', 'E'].includes(category)) {
      console.error(`ERROR: Invalid category [${category}] for team ${teamname}.`);
      ok = false;
    }

    if (other === undefined || other === "") {
      console.warn(`"Other" field not set for team ${teamname}`);
      console.warn(`  The other field should include any info which could help identify a team. (team name, contestant names, school, email addresses, etc.)`);
    }
    if(other !== undefined &&  other.length > 700){
      console.error(`"Other" filed is too long (${other.length} to be exact)`);
      ok = false;
    }

    if (teamId === undefined || teamId === "") {
      teamId = randomUUID();
    } else if (teamId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) === null) {
      ok = false;
      console.error(`ID is not a GUID for team ${teamname}`);
      console.error(`  Found: ${teamId}`);
      console.error(`  Expected format is exactly: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
    }

    if (found_ids.has(teamId)) {
      console.error('Duplicate ID');
      ok = false;
    } else {
      found_ids.add(teamId);
    }

    if (login_code === undefined || login_code === "") {
      login_code = generateLoginCode();
    } else if (login_code.match(/^[0-9]{3}-[0-9]{4}-[0-9]{3}$/) === null) {
      ok = false;
      console.error(`Login Code is not valid for team ${teamname}`);
      console.error(`Found: ${login_code}`);
      console.error(`Expected format: 111-2222-333`);
    }

    if (found_login_codes.has(login_code)) {
      console.error('Duplicate Login Code');
      ok = false;
    } else {
      found_login_codes.add(login_code);
    }

    if (credentials === undefined || credentials === "") {
      credentials = randomUUID();
    } else if (credentials.match(/^[0-9a-f\-]+$/) === null) {
      ok = false;
      console.error(`Credential is not a GUID for team ${teamname}`);
      console.error(`  Found: ${credentials}`);
      console.error(`  Expected format is usually: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
    }

    if (ok) {
      console.info(`Adding ${teamname} to DB.`);
      try {
        await teams.insertTeam({teamname, category, email, other, teamId, joinCode: login_code, credentials});
      } catch (err) {
        if (err instanceof ValidationError) {
          console.error(`Failed to validate team when adding to DB: ${err}`);
          ok = false;
        } else {
          console.log('We experienced an unexpected error during import. This type of error is not handled in the import scritp, please file a bug report in the GitHub repository!')
          throw err;
        }
      }
    }

    if (ok) {
      console.info(`Successfully imported team ${teamname}.`);
      const row_to_export = [teamname, category, email, other, teamId, login_code, credentials];
      export_table.push(row_to_export);
      successful++;
    } else {
      console.error(`Failed to import team ${teamname}. See reasons above.`);
      console.error(''); // separate errors
      failed++;
    }
  }
  console.info("Summary:");
  console.info(`Successfully imported ${successful} teams, failed ${failed} times.`);
  // TODO: Move the file
  export_table.unshift(expected_header);
  writeFileSync(`${filename}.export`, export_table.map(row => row.join('\t')).join('\n'), { 'encoding': 'utf-8' });

}
