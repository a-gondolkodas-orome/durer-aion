/** The team import's file format: its columns, the rule each cell must satisfy,
 * and the parser that applies them.
 *
 * It lives here rather than next to the importer because three callers need the
 * same answer — the CLI (`apps/online-backend/src/import_teams.ts`), the admin
 * API, and the admin page, which checks a file before uploading it. Written
 * once, so the page cannot accept a file the server then refuses.
 *
 * The rules mirror the database's own validators in
 * `apps/online-backend/src/server/model.ts`. The database stays the authority;
 * this pre-pass exists so a bad file is refused before anything is written
 * rather than halfway through, and so a limit can be stricter here than the
 * column is wide — see `OTHER_IMPORT_MAX_LENGTH` below.
 *
 * What this module deliberately does not do:
 *
 *   - **generate the blank `ID` / `Login Code` / `Credentials` cells.** A join
 *     code is a team's login secret, and only the server can check a generated
 *     one against the teams already in the database.
 *   - **word its problems.** It reports codes; the CLI prints English and the
 *     admin page Hungarian. Sharing the rule should not drag either language
 *     into the other's caller.
 */

export const TEAM_IMPORT_HEADER = [
  'Teamname', 'Category', 'Email', 'Other', 'ID', 'Login Code', 'Credentials',
] as const;

export type TeamImportColumn = typeof TEAM_IMPORT_HEADER[number];

/** The age categories, which decide which games a team is served. */
export const TEAM_CATEGORIES = ['C', 'D', 'E'] as const;

export const TEAMNAME_MAX_LENGTH = 255;
export const EMAIL_MAX_LENGTH = 255;

/** What the import accepts in `Other`, which is deliberately less than the
 * column holds (`OTHER_MAX_LENGTH` in the backend's `model.ts`, 1024).
 *
 * The difference is not headroom, it is the room the audit trail grows into:
 * the admin routes append `prevstratid:` and `te[…]:` notes to this same field,
 * and sequelize validates a changed attribute on every save. #497 is the bug
 * that made the point — with both limits at 700, a team imported with notes
 * that long had its first reset refused, for good. */
export const OTHER_IMPORT_MAX_LENGTH = 700;

export const JOIN_CODE_PATTERN = /^[0-9]{3}-[0-9]{4}-[0-9]{3}$/;

// Two different rules, because `model.ts` has two: `teamId` is validated with
// sequelize's `isUUID: 4`, which pins the version and variant nibbles, while
// `credentials` only has to be hex in a UUID's shape.
export const TEAM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CREDENTIALS_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type TeamTsvProblemCode =
  // The file as a whole.
  | 'header-mismatch'
  | 'no-rows'
  | 'wrong-column-count'
  // One cell.
  | 'empty-teamname'
  | 'teamname-too-long'
  | 'invalid-category'
  | 'email-too-long'
  | 'other-missing'
  | 'other-too-long'
  | 'invalid-team-id'
  | 'invalid-join-code'
  | 'invalid-credentials'
  // A value this file uses twice.
  | 'duplicate-teamname'
  | 'duplicate-team-id'
  | 'duplicate-join-code'
  // A value a live team already holds. Only the server can see these, so
  // `parseTeamsTsv` never reports them.
  | 'teamname-taken'
  | 'team-id-taken'
  | 'join-code-taken'
  | 'database-refused';

export interface TeamTsvProblem {
  /** The file's own 1-based line number, header included, so it is the line a
   * spreadsheet shows. `0` means the file as a whole. */
  row: number;
  column?: TeamImportColumn;
  severity: 'error' | 'warning';
  code: TeamTsvProblemCode;
  /** The offending value, when quoting it helps. */
  found?: string;
  /** For a duplicate, the line that used the value first. */
  otherRow?: number;
}

/** One data row, blanks still blank — filling them in is the server's job. */
export interface ParsedTeamRow {
  row: number;
  teamname: string;
  category: string;
  email: string;
  other: string;
  teamId: string;
  joinCode: string;
  credentials: string;
}

export interface TeamTsvParseResult {
  rows: ParsedTeamRow[];
  problems: TeamTsvProblem[];
  /** No problem has severity `error`, so the file is safe to import. */
  ok: boolean;
}

// The format quotes nothing and splits on tabs and newlines, so a cell may
// carry neither: a team name with a tab in it would shift every column after
// it. Used when writing a file, and mirrored by the column-count check when
// reading one.
const scrub = (value: string) => value.replace(/[\t\r\n]+/g, ' ');

/** The export the admin downloads and the CLI writes: the header, then one row
 * per team. Feeding it straight back in is what makes an export a backup. */
export function teamsToImportTsv(rows: readonly (readonly string[])[]): string {
  const lines = [TEAM_IMPORT_HEADER.join('\t'), ...rows.map(row => row.map(scrub).join('\t'))];
  return `${lines.join('\n')}\n`;
}

function sameHeader(found: readonly string[]): boolean {
  return found.length === TEAM_IMPORT_HEADER.length
    && TEAM_IMPORT_HEADER.every((column, index) => found[index] === column);
}

export function parseTeamsTsv(content: string): TeamTsvParseResult {
  const problems: TeamTsvProblem[] = [];
  const rows: ParsedTeamRow[] = [];
  const error = (detail: Omit<TeamTsvProblem, 'severity'>) => problems.push({ ...detail, severity: 'error' });
  const warn = (detail: Omit<TeamTsvProblem, 'severity'>) => problems.push({ ...detail, severity: 'warning' });

  const lines = content.split('\n');
  const header = (lines[0] ?? '').split('\t').map(cell => cell.trim());
  if (!sameHeader(header)) {
    // One problem, whatever is wrong with it: the header is a single fact about
    // the file, and the importer reads by position regardless, so a mismatch is
    // worth saying once and is not always a mistake.
    warn({ row: 1, code: 'header-mismatch', found: header.join(', ') });
  }

  // The first line each value was seen on, so a duplicate can name both.
  const firstTeamname = new Map<string, number>();
  const firstTeamId = new Map<string, number>();
  const firstJoinCode = new Map<string, number>();

  for (let index = 1; index < lines.length; index++) {
    const row = index + 1;
    const line = lines[index];
    // A blank line is what a text editor leaves at the end of a file and what
    // separates blocks in a hand-written one. Skipped in silence: it is neither
    // a team nor a mistake.
    if (line.trim() === '') {
      continue;
    }

    const cells = line.split('\t').map(cell => cell.trim());
    if (cells.length > TEAM_IMPORT_HEADER.length) {
      // More columns than the format has means the row is not what it looks
      // like — most often a tab inside a cell, which has shifted everything
      // after it. Reading the shifted values would import nonsense.
      error({ row, code: 'wrong-column-count', found: `${cells.length}` });
      continue;
    }
    // Trailing empty cells are what an editor drops, so a short row is a row
    // whose last columns are blank — which is exactly how a file asks for an
    // id, a join code and credentials to be generated.
    const at = (column: number) => cells[column] ?? '';
    const [teamname, category, email, other, teamId, joinCode, credentials] =
      [at(0), at(1), at(2), at(3), at(4), at(5), at(6)];

    if (teamname === '') {
      error({ row, column: 'Teamname', code: 'empty-teamname' });
    } else if (teamname.length > TEAMNAME_MAX_LENGTH) {
      error({ row, column: 'Teamname', code: 'teamname-too-long', found: `${teamname.length}` });
    } else {
      const first = firstTeamname.get(teamname);
      if (first === undefined) {
        firstTeamname.set(teamname, row);
      } else {
        error({ row, column: 'Teamname', code: 'duplicate-teamname', found: teamname, otherRow: first });
      }
    }

    if (!(TEAM_CATEGORIES as readonly string[]).includes(category)) {
      error({ row, column: 'Category', code: 'invalid-category', found: category });
    }

    if (email.length > EMAIL_MAX_LENGTH) {
      error({ row, column: 'Email', code: 'email-too-long', found: `${email.length}` });
    }

    if (other === '') {
      // Not fatal, but the field is how an organiser finds a team again from a
      // phone call: contestant names, school, email addresses.
      warn({ row, column: 'Other', code: 'other-missing' });
    } else if (other.length > OTHER_IMPORT_MAX_LENGTH) {
      error({ row, column: 'Other', code: 'other-too-long', found: `${other.length}` });
    }

    // A supplied identifier is checked for shape here rather than left to the
    // database, so a whole file is refused before any of it is written. It also
    // catches the shifted row a column count cannot: whatever landed in these
    // three columns will not look like an id, a code and credentials.
    if (teamId !== '') {
      if (!TEAM_ID_PATTERN.test(teamId)) {
        error({ row, column: 'ID', code: 'invalid-team-id', found: teamId });
      } else {
        const first = firstTeamId.get(teamId);
        if (first === undefined) {
          firstTeamId.set(teamId, row);
        } else {
          error({ row, column: 'ID', code: 'duplicate-team-id', found: teamId, otherRow: first });
        }
      }
    }

    if (joinCode !== '') {
      if (!JOIN_CODE_PATTERN.test(joinCode)) {
        error({ row, column: 'Login Code', code: 'invalid-join-code', found: joinCode });
      } else {
        const first = firstJoinCode.get(joinCode);
        if (first === undefined) {
          firstJoinCode.set(joinCode, row);
        } else {
          error({ row, column: 'Login Code', code: 'duplicate-join-code', found: joinCode, otherRow: first });
        }
      }
    }

    if (credentials !== '' && !CREDENTIALS_PATTERN.test(credentials)) {
      error({ row, column: 'Credentials', code: 'invalid-credentials', found: credentials });
    }

    rows.push({ row, teamname, category, email, other, teamId, joinCode, credentials });
  }

  if (rows.length === 0) {
    error({ row: 0, code: 'no-rows' });
  }

  return { rows, problems, ok: !problems.some(item => item.severity === 'error') };
}
