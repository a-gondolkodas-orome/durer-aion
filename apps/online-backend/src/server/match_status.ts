import type { State, StorageAPI } from "boardgame.io";
import { relayProblemResults, type GameStateMixin, type MyGameState } from "game";
import type { FinishedMatchStatus, InProgressMatchStatus, MatchStatus } from "schemas";
import type { TeamModel } from "./model";

/** The team row's two match columns. Each holds the id of the team's current
 *  match of that kind, or null before it starts and after an admin reset. */
export type MatchKind = "relayMatchID" | "strategyMatchID";

export interface TeamMatches {
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

/**
 * A match's status, read off its game state: the one place it is decided.
 *
 * Nothing about it is stored on the team row, so there is no copy to fall out
 * of step with the game — a team that closes the tab at the buzzer reads as
 * finished, with its points, once the time is up, and a match an organiser
 * extends reads as running again. The score is the game's own, so an answer the
 * game still judges a few seconds past the end (its `1000 * 10` checks) counts
 * whenever it lands, and the match can read as finished from the end itself.
 */
export function deriveMatchStatus(
  kind: MatchKind,
  matchID: string,
  { G, ctx }: Pick<State, "G" | "ctx">,
  now: Date,
): InProgressMatchStatus | FinishedMatchStatus {
  const timer = G as GameStateMixin;
  const startAt = new Date(timer.start);
  const endAt = new Date(timer.end);
  if (ctx.gameover === undefined && now.getTime() <= endAt.getTime())
    return { state: "IN PROGRESS", matchID, startAt, endAt };

  const finished: FinishedMatchStatus = { state: "FINISHED", matchID, startAt, endAt, score: timer.points };
  if (kind === "relayMatchID")
    return { ...finished, relayResults: relayProblemResults(G as MyGameState) };
  // The play phase records the game the time cut off when it ends (gameWrapper),
  // which a match that ran out with nobody playing never does: that game is
  // added here, and only if one was being played.
  const cutOff = ctx.gameover === undefined && ctx.phase === "play"
    && timer.difficulty === "live" && timer.winner === null;
  return { ...finished, strategyResults: cutOff ? [...timer.liveResults, "unfinished"] : timer.liveResults };
}

/** {@link deriveMatchStatus} for a match in storage, or NOT STARTED for none.
 *  A row naming a match storage does not have is a broken row, and fails
 *  loudly rather than reading as a state the team could act on. */
export async function matchStatus(
  db: StorageAPI.Async | StorageAPI.Sync,
  kind: MatchKind,
  matchID: string | null,
  now: Date,
): Promise<MatchStatus> {
  if (matchID === null) return { state: "NOT STARTED" };
  const { state } = await db.fetch(matchID, { state: true });
  if (!state) throw new Error(`Match ${matchID} in the team's ${kind} column is not in storage.`);
  return deriveMatchStatus(kind, matchID, state, now);
}

/** Both of a team's matches, as of `now`. */
export async function teamMatches(
  db: StorageAPI.Async | StorageAPI.Sync,
  team: Pick<TeamModel, MatchKind>,
  now: Date = new Date(),
): Promise<TeamMatches> {
  const [relayMatch, strategyMatch] = await Promise.all([
    matchStatus(db, "relayMatchID", team.relayMatchID, now),
    matchStatus(db, "strategyMatchID", team.strategyMatchID, now),
  ]);
  return { relayMatch, strategyMatch };
}

/** An admin route's team: the row, and both matches as they stand. */
export async function adminTeamView(
  db: StorageAPI.Async | StorageAPI.Sync,
  team: TeamModel,
): Promise<ReturnType<TeamModel["toJSON"]> & TeamMatches> {
  return { ...team.toJSON(), ...await teamMatches(db, team) };
}
