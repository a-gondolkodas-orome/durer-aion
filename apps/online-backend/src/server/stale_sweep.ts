import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

/** What one sweep did: the matches it closed, and the ones it could not. */
export interface SweepResult {
  closed: string[];
  failed: { matchID: string; message: string }[];
}

export const STALE_SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Closes every match whose time has run out, whatever the team's browser is
 * doing.
 *
 * Every other place a match is closed from needs the team: the socket handler
 * needs a packet, `/team/me`'s stale check needs the page loaded again. So a
 * team that closed the tab at the buzzer kept `IN PROGRESS` and no score. The
 * rule is the one `/team/me` already applies, without the team.
 *
 * One match per team per sweep, since `checkStaleMatch` names the first it
 * finds; the next sweep takes the second.
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
      // One unclosable match must not cost every later team its score, which is
      // the whole reason this runs unattended.
      result.failed.push({
        matchID,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return result;
}

/**
 * Runs {@link sweepStaleMatches} until the returned function is called.
 *
 * `report` is handed every sweep that did something, so what is written about
 * it stays with the server rather than in here.
 */
export function startStaleSweep(
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync,
  report: (result: SweepResult) => void = () => undefined,
  intervalMs: number = STALE_SWEEP_INTERVAL_MS,
): () => void {
  const tick = setInterval(() => {
    // setInterval ignores what its callback returns, so a rejection here would
    // be an unhandled one — which ends the process and every match on it.
    void sweepStaleMatches(teams, db).then(
      result => {
        if (result.closed.length > 0 || result.failed.length > 0) report(result);
      },
      (error: unknown) => {
        report({ closed: [], failed: [{ matchID: "(the sweep itself)", message: String(error) }] });
      },
    );
  }, intervalMs);
  // Never the reason the process stays up.
  tick.unref();
  return () => { clearInterval(tick); };
}
