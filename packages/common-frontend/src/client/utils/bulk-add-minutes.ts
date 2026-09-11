import { TeamModelDto } from '../dto/TeamStateDto';

/** What one bulk extension did.
 *
 * `extended` counts matches rather than teams: a team may have both a relay and
 * a strategy match running, and each is extended separately.
 */
export interface BulkAddMinutesResult {
  extended: number;
  failures: { teamName: string; message: string }[];
}

/** The running matches a bulk extension is for, in the order they are offered
 * on the page. A team with neither contributes none. */
function runningMatchIds(team: TeamModelDto): string[] {
  const ids: string[] = [];
  if (team.relayMatch.state === 'IN PROGRESS') ids.push(team.relayMatch.matchID);
  if (team.strategyMatch.state === 'IN PROGRESS') ids.push(team.strategyMatch.matchID);
  return ids;
}

/** Extends every running match by `minutes`, and reports what happened.
 *
 * One refused match must not cost the teams after it their extension, so each
 * call is caught on its own and the walk continues — the loop this replaces
 * shared one `try`, and the first refusal left every later team without the
 * minutes while the organiser was told only "an error happened". A refusal is
 * routine rather than exceptional: the list is a snapshot, and a match that
 * finished since it was taken is answered with a 501 that names it.
 *
 * Sequential on purpose. Firing a request per team at once would be hundreds in
 * flight against the one backend container, and every one of them is a
 * read-modify-write of a match another request may be moving at the same time.
 *
 * The caller decides what a failure means; this reports the server's own
 * message for each, so an organiser can tell one refused match from a round
 * that never reached the server.
 */
export async function addMinutesToRunningMatches(
  teams: TeamModelDto[],
  minutes: number,
  addMinutes: (matchId: string, minutes: number) => Promise<unknown>,
): Promise<BulkAddMinutesResult> {
  const result: BulkAddMinutesResult = { extended: 0, failures: [] };
  for (const team of teams) {
    for (const matchId of runningMatchIds(team)) {
      try {
        await addMinutes(matchId, minutes);
        result.extended += 1;
      } catch (error) {
        result.failures.push({
          teamName: team.teamName,
          message: error instanceof Error ? error.message : 'Váratlan hiba történt',
        });
      }
    }
  }
  return result;
}

/** The one line the organiser reads afterwards.
 *
 * It names the teams that were left out, because the button's whole failure
 * mode was being unable to tell which. Saying how many *did* get the minutes is
 * the other half: pressing again is what gives the earlier teams the extension
 * twice, and `addminutes` adds a delta with nothing to make a repeat a no-op.
 */
export function bulkAddMinutesMessage(result: BulkAddMinutesResult, minutes: number): string {
  const extended = `${result.extended} meccs kapott +${minutes} percet`;
  if (result.failures.length === 0) return extended;
  const names = result.failures.map(failure => `${failure.teamName} (${failure.message})`).join(', ');
  return `${extended}, ${result.failures.length} sikertelen: ${names}`;
}
