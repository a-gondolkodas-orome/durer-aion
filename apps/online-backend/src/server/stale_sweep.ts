import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

export interface SweepResult {
  closed: string[];
  failed: { matchID: string; message: string }[];
}

export const STALE_SWEEP_INTERVAL_MS = 60 * 1000;

/** Closes every match whose time has run out, with no team present.
 *
 *  Every other close path needs the team's browser — the socket handler needs a
 *  packet, `/team/me`'s stale check needs the page loaded again — so a team that
 *  closes the tab at the buzzer would otherwise sit on `IN PROGRESS` with no
 *  score. `checkStaleMatch` decides and `closeMatch` writes it, as elsewhere.
 */
export async function sweepStaleMatches(
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync,
): Promise<SweepResult> {
  const result: SweepResult = { closed: [], failed: [] };
  for (const team of await teams.listTeams() ?? []) {
    const stale = await checkStaleMatch(team);
    if (!stale.isStale) continue;
    const { matchID } = team[stale.gameState] as InProgressMatchStatus;
    try {
      await closeMatch(matchID, teams, db);
      result.closed.push(matchID);
    } catch (error) {
      // One unclosable match must not cost every later team its score.
      result.failed.push({ matchID, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return result;
}

/** Runs {@link sweepStaleMatches} until the returned function is called. */
export function startStaleSweep(
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync,
  report: (result: SweepResult) => void = () => undefined,
  intervalMs: number = STALE_SWEEP_INTERVAL_MS,
): () => void {
  const tick = setInterval(() => {
    // setInterval drops what its callback returns, and an unhandled rejection
    // ends the process and every match being played on it.
    void sweepStaleMatches(teams, db).then(
      result => {
        if (result.closed.length > 0 || result.failed.length > 0) report(result);
      },
      (error: unknown) => {
        report({ closed: [], failed: [{ matchID: "(the sweep itself)", message: String(error) }] });
      },
    );
  }, intervalMs);
  tick.unref(); // never the reason the process stays up
  return () => { clearInterval(tick); };
}
