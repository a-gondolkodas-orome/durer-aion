import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

/** How long past `endAt` a match is left alone. The games accept a move up to
 *  10 s after `endAt` (`packages/game`, the `1000 * 10` checks), and the move
 *  that ends the game closes the match with the final score; a sweep inside
 *  that window would race it and could write the score from before that move
 *  last. Three times the window, so a slow move or clock skew stays inside. */
export const STALE_GRACE_MS = 30 * 1000;

/** Closes every match whose time ran out at least `STALE_GRACE_MS` ago, with
 *  no team present.
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
  const endedBefore = new Date(Date.now() - STALE_GRACE_MS);
  for (const team of await teams.listTeams() ?? []) {
    const stale = await checkStaleMatch(team, endedBefore);
    if (!stale.isStale) continue;
    // One unclosable match must not cost every later team its score.
    await closeMatch((team[stale.gameState] as InProgressMatchStatus).matchID, teams, db)
      .catch(onError);
  }
}
