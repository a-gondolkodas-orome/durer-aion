import type { LogEntry } from "boardgame.io";

// The match the client did not name: boardgame.io calls it "default", and the
// dry run only ever runs the one per game.
const DEFAULT_MATCH_ID = "default";

/// The match log boardgame.io keeps for itself. In the live round the
/// organisers read these entries out of the server's storage
/// (`GET /game/admin/:matchId/logs`); here the local master is the server, and
/// `Local({ persist: true })` writes the same entries to localStorage under
/// `<storageKey>_log`, as `[matchID, entries][]`.
///
/// Parsed without a guard of its own, as boardgame.io parses it: a log this
/// cannot read is one the client itself already failed on.
export function readPersistedLog(storageKey: string): LogEntry[] {
  const stored = localStorage.getItem(storageKey + "_log");
  if (stored === null) {
    return [];
  }
  const matches = JSON.parse(stored) as [string, LogEntry[]][];
  const match = matches.find(([matchID]) => matchID === DEFAULT_MATCH_ID) ?? matches[0];
  return match?.[1] ?? [];
}
