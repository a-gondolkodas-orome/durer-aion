import { readFileSync, writeFileSync } from 'fs';
import { randomInt, randomUUID } from 'crypto';
import { ValidationError, ValidationErrorItem } from 'sequelize';
import { TeamsRepository } from './db';
import { OTHER_IMPORT_MAX_LENGTH } from './model';
import { namesCompetition, validateStartWindow } from 'schemas';
import type { CompetitionConfig, StartWindow } from 'schemas';
import { registry } from 'problem-bank/all';

// The importer's columns, in the order the export writes them. A file may hold
// them in any order: each is found by its header, whatever its case. Each row
// names the competition its team enters, by id or by edition, round and
// category (`20 online C`), so one file holds a whole round's teams, every
// category's competition at once.
const COLUMNS = ["Teamname", "Competition", "Email", "Other", "ID", "Login Code", "Credentials", "Opens At", "Closes At"] as const;
type Column = typeof COLUMNS[number];
const REQUIRED: readonly Column[] = ["Teamname", "Competition"];

/** The registered competition a row's `Competition` cell names, by its id or
 * by edition, round and category, or the reason it names none. */
function competitionNamed(cell: string): CompetitionConfig | { refused: string } {
  const text = cell.trim();
  const byId = registry.competitions.get(text);
  if (byId !== undefined) return byId;
  const named = [...registry.competitions.values()].filter(({ metadata }) => namesCompetition(text, metadata));
  if (named.length === 1) return named[0];
  if (named.length > 1) {
    return { refused: `Több verseny is „${text}”: ${named.map(({ id }) => id).join(', ')}. Az azonosítóval egyértelmű.` };
  }
  return { refused: `Nincs ilyen verseny: „${text}”. Az azonosítója vagy a neve kell, például: 20 online C.` };
}

/** The registered competition a row's team enters, with the category the team
 * is stored with (its metadata's, shown and never acted on), or the reason it
 * cannot take it. */
export function competitionToImportInto(competitionId: string):
  { competition: CompetitionConfig, category: string } | { refused: string } {
  const competition = competitionNamed(competitionId);
  if ('refused' in competition) {
    return competition;
  }
  const { metadata } = competition;
  return { competition, category: metadata.kind === 'competition' ? metadata.category : '' };
}

/** The team's own start window from a row's `Opens At` and `Closes At`
 * cells: none when both are blank, else the window or the reason it is not one. */
export function readStartWindow(opensAt: string, closesAt: string): StartWindow | undefined | { refused: string } {
  if (opensAt === '' && closesAt === '') return undefined;
  if (opensAt === '') {
    return { refused: 'a Closes At csak Opens At-tel együtt adható meg.' };
  }
  const window: StartWindow = { opensAt, ...(closesAt !== '' && { closesAt }) };
  if (validateStartWindow(window).length > 0) {
    return { refused: `az Opens At („${opensAt}”) és a Closes At („${closesAt}”) időpont kell legyen időzónával, `
      + 'például 2026-11-20T15:00+01:00, és a Closes At az Opens At után.' };
  }
  return window;
}

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
    return { refused: `A fejléc többször is tartalmazza: ${twice.join(', ')}.` };
  }
  const missing = REQUIRED.filter(column => positions[column] === undefined);
  if (missing.length > 0) {
    // A first line holding a team rather than a header lands here too, which
    // is the point: read as a header, it would drop that team in silence.
    return { refused: `Az első sornak a fejlécnek kell lennie, benne legalább a ${REQUIRED.join(' és a ')} `
      + `oszloppal; ebből hiányzik: ${missing.join(', ')}.` };
  }
  return { positions, unknown };
}

// How many of the teams already there the grouped line names before it only
// counts the rest.
const NAMED_EXISTING = 10;

// The model's own messages are English (model.ts), and the admin page is
// Hungarian; each is worded here by the column it is about. One the table does
// not know is quoted as it came.
const UNIQUE_TEXT: Record<string, string> = {
  teamName: 'már van ilyen nevű csapat ebben a versenyben',
  // The other column of the same constraint, which postgres names too.
  competitionId: 'már van ilyen nevű csapat ebben a versenyben',
  teamId: 'már van ilyen ID-jú csapat',
  joinCode: 'már van ilyen belépőkódú csapat',
  credentials: 'már van ilyen Credentials-ű csapat',
};
const INVALID_TEXT: Record<string, string> = {
  teamName: 'a csapatnév túl hosszú (legfeljebb 255 karakter)',
  teamId: 'az ID nem érvényes UUIDv4',
  joinCode: 'a belépőkód nem 111-2222-333 alakú',
  credentials: 'a Credentials nem érvényes UUID',
  email: 'az Email túl hosszú (legfeljebb 255 karakter)',
};
function databaseText(item: ValidationErrorItem): string {
  const table = item.validatorKey === 'not_unique' ? UNIQUE_TEXT : INVALID_TEXT;
  return (item.path !== null ? table[item.path] : undefined) ?? item.message;
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
  const { successful, existing, failed, export_table, logs } = await import_teams_from_tsv(teams, filename);
  for (let i = 0; i < logs.value.length; i++) {
    console[logs.sev[i]](logs.value[i]);
  }
  console.info(`Összesen ${successful} csapat került be, ${existing} már szerepelt, ${failed} sor hibás.`);
  export_table.unshift([...COLUMNS]);
  writeFileSync(`${filename}.export`, export_table.map(row => row.join('\t')).join('\n'), { 'encoding': 'utf-8' });
}

export async function import_teams_from_tsv(teams: TeamsRepository, filename: string) {
  const logs: {
    sev: ('warn' | 'error')[];
    value: string[];
  } = {
    sev: [],
    value: [],
  };

  function onwarn(msg: string) { logs.value.push(msg); logs.sev.push('warn') }
  function onerror(msg: string) { logs.value.push(msg); logs.sev.push('error') }


  const untrimmed_rows = readFileSync(filename, 'utf-8').split('\n');
  const rows = untrimmed_rows;
  if (rows[rows.length - 1].trim() === "") {
    rows.pop();
  }
  const table = rows.map(row => row.split('\t'));
  const header = table.shift() ?? [];
  const export_table: string[][] = [];
  const read = readHeader(header);
  // A header with no tab is one cell, so every column reads as missing even
  // when the words are all there: that is the one thing to say about it.
  if (header.length === 1 && header[0].trim() !== '') {
    onerror('Egy csapat sem került be. A fejlécben nincs tabulátor: az oszlopokat tabulátorral kell elválasztani, '
      + 'nem szóközzel.');
    onerror(`A fájl első sora: „${header[0].trim()}”`);
    return { successful: 0, existing: 0, failed: 0, export_table, logs };
  }
  if ('refused' in read) {
    onerror(`Egy csapat sem került be. ${read.refused}`);
    onerror(`A fájl első sora: ${header.map(cell => cell.trim()).join(', ')}`);
    onerror('Oszlopok, tetszőleges sorrendben: Teamname és Competition (kötelező, a Competition a verseny '
      + 'neve, például 20 online C, vagy az azonosítója); Email, Other, ID, Login Code, Credentials, Opens At és Closes At (elhagyható; '
      + 'az ID-t, a Login Code-ot és a Credentials-t ilyenkor a szerver generálja, az Opens At és a Closes At a csapat '
      + 'saját indítási ablaka a versenyé helyett).');
    return { successful: 0, existing: 0, failed: 0, export_table, logs };
  }
  if (read.unknown.length > 0) {
    onwarn(`Ezeket az oszlopokat nem ismerjük, kimaradnak: ${read.unknown.join(', ')}`);
  }
  const { positions } = read;

  let successful = 0;
  let failed = 0; // not counting blank lines
  await teams.connect();
  // Re-running a grown registration list is how late teams are added, so a
  // row naming a team that is already in its competition is that team, not a
  // clash — as long as the identifiers it supplies are that team's own.
  const liveKey = (competitionId: string, teamName: string) => JSON.stringify([competitionId, teamName]);
  const live = new Map((await teams.listTeams() ?? [])
    .map(team => [liveKey(team.competitionId, team.teamName), team]));
  const existing: string[] = [];
  for (const [index, row] of table.entries()) {
    // The file's own line number, header included, as an editor shows it.
    const line = index + 2;
    // A blank line is what an editor leaves between blocks or at the end.
    if (row.every(column => column.trim() === '')) {
      continue;
    }
    // A line with text and no tab is not a row with blank columns: it is a
    // file separated by spaces, which cannot be split safely — a team name
    // holds spaces of its own.
    if (row.length === 1) {
      onerror(`${line}. sor: nincs benne tabulátor („${row[0].trim()}”), az oszlopokat tabulátorral kell `
        + 'elválasztani, nem szóközzel.');
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
    const competitionId = cell("Competition");
    const email = cell("Email");
    const other = cell("Other");
    const readWindow = readStartWindow(cell("Opens At"), cell("Closes At"));
    const startWindow = readWindow !== undefined && 'refused' in readWindow ? undefined : readWindow;
    // Every problem names the line and the team, so each stands on its own.
    const where = teamname === '' ? `${line}. sor` : `${line}. sor (${teamname})`;
    let ok = true;
    let teamId = cell("ID");
    let login_code = cell("Login Code");
    let credentials = cell("Credentials");
    if (teamname === "") {
      onerror(`${where}: hiányzik a csapatnév.`);
      ok = false;
    }

    let into: ReturnType<typeof competitionToImportInto> | null = null;
    if (competitionId === "") {
      onerror(`${where}: hiányzik a verseny (Competition): az azonosítója vagy a neve, például 20 online C.`);
      ok = false;
    } else {
      into = competitionToImportInto(competitionId);
      if ('refused' in into) {
        onerror(`${where}: ${into.refused}`);
        ok = false;
      }
    }

    if (readWindow !== undefined && 'refused' in readWindow) {
      onerror(`${where}: ${readWindow.refused}`);
      ok = false;
    }

    // Stricter than the column, on purpose: the admin routes append an audit
    // trail to this field, and `model.ts` says what the gap is for.
    if (other.length > OTHER_IMPORT_MAX_LENGTH) {
      onerror(`${where}: az Other túl hosszú (${other.length} karakter, legfeljebb ${OTHER_IMPORT_MAX_LENGTH}).`);
      ok = false;
    }

    // By the competition's id, which a row naming it by edition, round and
    // category does not hold.
    const there = into !== null && !('refused' in into)
      ? live.get(liveKey(into.competition.id, teamname)) : undefined;
    if (ok && there !== undefined) {
      const differs = [
        teamId !== '' && teamId !== there.teamId ? 'ID' : null,
        login_code !== '' && login_code !== there.joinCode ? 'belépőkód' : null,
        credentials !== '' && credentials !== there.credentials ? 'Credentials' : null,
      ].filter(name => name !== null);
      if (differs.length > 0) {
        onerror(`${where}: már van ilyen nevű csapat, de más ${differs.join(', ')} értékkel.`);
        failed++;
        continue;
      }
      existing.push(teamname);
      // Not applied: the import never changes a team that is already there.
      // Said, since a fix made in the file would otherwise vanish in silence.
      if (email !== '' && email !== (there.email ?? '')) {
        onwarn(`${where}: már szerepel, más e-mail címmel; a fájlbeli nem került át.`);
      }
      // Only from a file that has the columns: one without them says nothing
      // about a window the admin page set.
      if ((positions["Opens At"] !== undefined || positions["Closes At"] !== undefined)
        && ((startWindow?.opensAt ?? null) !== there.startOpensAt
          || (startWindow?.closesAt ?? null) !== there.startClosesAt)) {
        onwarn(`${where}: már szerepel, más Opens At vagy Closes At értékkel; a fájlbeli nem került át.`);
      }
      continue;
    }

    if (teamId === "") {
      teamId = randomUUID();
    }

    if (login_code === "") {
      login_code = generateLoginCode();
    }

    if (credentials === "") {
      credentials = randomUUID();
    }

    if (ok && into !== null && !('refused' in into)) {
      try {
        await teams.insertTeam({
          teamname, competitionId: into.competition.id, category: into.category, email, other,
          startWindow, teamId,
          joinCode: login_code, credentials,
        });
      } catch (err) {
        if (err instanceof ValidationError) {
          // A constraint the database refuses can come with no items at all.
          // A constraint over two columns names both, with one reason.
          const reasons = err.errors.length > 0 ? [...new Set(err.errors.map(databaseText))].join('; ') : err.message;
          onerror(`${where}: ${reasons}.`);
          ok = false;
        } else {
          console.log('We experienced an unexpected error during import. This type of error is not handled in the import script, please file a bug report in the GitHub repository!')
          throw err;
        }
      }
    }

    if (ok) {
      // The id, however the row named the competition: it stays the same when
      // a competition with the same name is registered later.
      const row_to_export = [teamname, into !== null && !('refused' in into) ? into.competition.id : competitionId, email, other,
        teamId, login_code, credentials, startWindow?.opensAt ?? '', startWindow?.closesAt ?? ''];
      export_table.push(row_to_export);
      successful++;
    } else {
      failed++;
    }
  }

  if (existing.length > 0) {
    const named = existing.slice(0, NAMED_EXISTING).join(', ');
    const rest = existing.length > NAMED_EXISTING ? ` és még ${existing.length - NAMED_EXISTING}` : '';
    // First, so the rows that did go wrong are not read as part of it.
    logs.value.unshift(`${existing.length} csapat már szerepelt, változatlanul hagytuk: ${named}${rest}.`);
    logs.sev.unshift('warn');
  }

  return { successful, existing: existing.length, failed, export_table, logs };
}
