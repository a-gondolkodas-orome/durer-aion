import { DeletedTeamDto } from '../dto/TeamStateDto';

/** The archive rows deleted together, in the order the server serves them:
 * newest batch first, and within a batch in deletion order. */
export interface DeletedBatch {
  deletedAt: string;
  teams: DeletedTeamDto[];
}

export function batchesOf(teams: DeletedTeamDto[]): DeletedBatch[] {
  const batches: DeletedBatch[] = [];
  for (const team of teams) {
    const last = batches[batches.length - 1];
    if (last?.deletedAt === team.deletedAt) {
      last.teams.push(team);
    } else {
      batches.push({ deletedAt: team.deletedAt, teams: [team] });
    }
  }
  return batches;
}

// The columns the team import reads (`team_import.ts` in the backend), in its
// order, so the file goes straight back in through the admin page's upload:
// a restore of a batch's identities that works on any instance, offline. The
// match state is not among them — the import starts every team afresh.
export const IMPORT_HEADER = ['Teamname', 'Category', 'Email', 'Other', 'ID', 'Login Code', 'Credentials'];

// The import splits on tabs and newlines and quotes nothing, so a cell may
// carry neither; a team name with one would shift every column after it.
const cell = (value: string) => value.replace(/[\t\r\n]+/g, ' ');

export function deletedTeamsToImportTsv(teams: DeletedTeamDto[]): string {
  const rows = teams.map(team =>
    [team.teamName, team.category, team.email, team.other, team.teamId, team.joinCode, team.credentials]
      .map(cell)
      .join('\t'));
  return [IMPORT_HEADER.join('\t'), ...rows].join('\n') + '\n';
}
