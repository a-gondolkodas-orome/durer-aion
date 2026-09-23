import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

/** How long past `endAt` a match is left alone. A move up to 10 s after
 *  `endAt` is still judged (`packages/game`, the `1000 * 10` checks), so the
 *  score can still change until then, and the game's own close carries the
 *  final one. Waiting keeps this close from being the one written last with an
 *  earlier score. Three times the window, so a slow move or clock skew stays
 *  inside. */
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
  const endedBefore = Date.now() - STALE_GRACE_MS;
  for (const team of await teams.listTeams() ?? []) {
    const stale = await checkStaleMatch(team);
    if (!stale.isStale) continue;
    // `checkStaleMatch` has made `endAt` a Date by now.
    const match = team[stale.gameState] as InProgressMatchStatus;
    if (match.endAt.getTime() >= endedBefore) continue;
    // One unclosable match must not cost every later team its score.
    await closeMatch(match.matchID, teams, db).catch(onError);
  }
}
