import type { TeamModelDto } from '../dto/TeamStateDto';

// The importer's columns, in its order (`expected_header` in the backend's
// team_import.ts), so a file written here goes back in through the import.
const TEAM_TSV_HEADER = ['Teamname', 'Category', 'Email', 'Other', 'ID', 'Login Code', 'Credentials'];

// The importer splits on tabs and newlines and quotes nothing, so a cell may
// carry neither: one in a team name would shift every column after it.
const cell = (value: string | null | undefined) => (value ?? '').replace(/[\t\r\n]+/g, ' ');

/** Rows in the importer's column order, with its header, as one file. */
export function teamsTsv(rows: readonly (readonly (string | null | undefined)[])[]): string {
  return [TEAM_TSV_HEADER, ...rows].map(row => row.map(cell).join('\t')).join('\n') + '\n';
}

/** A team as the admin routes serve it, in the importer's column order. Email
 * and notes can be empty, or null on a database loaded before the import
 * stored empty strings. */
export function teamTsvRow(team: TeamModelDto & { other?: string | null }): (string | null | undefined)[] {
  return [team.teamName, team.category, team.email, team.other, team.teamId, team.joinCode, team.credentials];
}

/** Every file of join codes the admin page hands out is named the same way. */
export function joinCodesFileName(): string {
  return `durer-belepokodok-${new Date().toISOString().replace(/[:.]/g, '-')}.tsv`;
}
