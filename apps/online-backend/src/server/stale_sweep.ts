import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

/** Closes every match whose time has run out, with no team present.
 *
 *  Every other close path needs the team's browser — the socket handler needs a
 *  packet, `/team/me`'s stale check needs the page loaded again — so a team that
 *  closes the tab at the buzzer would otherwise sit on `IN PROGRESS` with no
 *  score. `checkStaleMatch` decides and `closeMatch` writes it, as elsewhere.
 */
export async function closeStaleMatches(
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync,
  onError: (error: unknown) => void,
) {
  for (const team of await teams.listTeams() ?? []) {
    const stale = await checkStaleMatch(team);
    if (!stale.isStale) continue;
    // One unclosable match must not cost every later team its score.
    await closeMatch((team[stale.gameState] as InProgressMatchStatus).matchID, teams, db)
      .catch(onError);
  }
}
