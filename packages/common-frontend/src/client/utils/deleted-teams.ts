import { teamsToImportTsv } from 'schemas';
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

// The columns the team import reads, in its order, so the file goes straight
// back in through the admin page's import: a restore of a batch's identities
// that works on any instance, offline. The match state is not among them — the
// import starts every team afresh.
//
// The writer and the header come from `schemas`, which is also what the
// importer reads them from, so the two cannot drift apart.
export { TEAM_IMPORT_HEADER as IMPORT_HEADER } from 'schemas';

export function deletedTeamsToImportTsv(teams: DeletedTeamDto[]): string {
  return teamsToImportTsv(teams.map(team =>
    [team.teamName, team.category, team.email, team.other, team.teamId, team.joinCode, team.credentials]));
}
