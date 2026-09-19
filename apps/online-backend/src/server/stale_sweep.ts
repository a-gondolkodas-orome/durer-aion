import type { StorageAPI } from "boardgame.io";
import type { InProgressMatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import { checkStaleMatch, closeMatch } from "./team_manage";

/** What one sweep did: the matches it closed, and the ones it could not. */
export interface SweepResult {
  closed: string[];
  failed: { matchID: string; message: string }[];
}

/** How often the sweep runs.
 *
 * A round is half an hour or an hour, and the only thing waiting on this is the
 * score of a match nobody is playing any more, so a minute is soon enough and
 * costs one query for the team list.
 */
export const STALE_SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Closes every match whose time has run out, whatever the team's browser is
 * doing.
 *
 * A match used to be closed from three places, and all three needed the team:
 * the socket handler's gameover check, which needs a packet; `/team/me`'s stale
 * check, which needs the team to load the page again; and `getNewGame`. So a
 * team that closed the tab at the buzzer — or whose laptop died at minute 50 —
 * kept `IN PROGRESS` and no score, and the points existed only inside
 * `GET /game/admin/:matchId/state`. The admin page cannot close a match either:
 * it offers a reset, which discards it.
 *
 * The rule is the one `/team/me` already applies, so this is that check without
 * the team: `checkStaleMatch` decides, `closeMatch` writes the score.
 *
 * The list is scanned in memory rather than queried. Both match columns are
 * JSON, a team's `endAt` lives inside one, and a few hundred rows is nothing
 * next to getting a JSON predicate subtly wrong — `deduceMatch` in `db.ts` is
 * what that looks like when it goes unnoticed.
 *
 * One match per team per sweep: `checkStaleMatch` names the first it finds, and
 * the row it reports against is the one this loaded. A team with both matches
 * stale at once is already a bug rather than a state the round produces, and
 * the next sweep takes the second.
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
 * `report` is handed every sweep that did something, so what is written about it
 * — a log line, a Sentry event — stays with the server rather than in here,
 * where a test would have to silence it.
 */
export function startStaleSweep(
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync,
  report: (result: SweepResult) => void = () => undefined,
  intervalMs: number = STALE_SWEEP_INTERVAL_MS,
): () => void {
  const tick = setInterval(() => {
    // setInterval ignores what its callback returns, so a rejection here would
    // be an unhandled one. Nothing above throws; this is the backstop.
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
