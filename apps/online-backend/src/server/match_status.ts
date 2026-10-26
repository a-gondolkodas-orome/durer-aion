import type { State, StorageAPI } from "boardgame.io";
import { PostgresStore } from "bgio-postgres";
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
  return { ...finished, strategyResults: timer.liveResults };
}

type Storage = StorageAPI.Async | StorageAPI.Sync;
type MatchState = Pick<State, "G" | "ctx">;

/**
 * The game state of each listed match that storage has, by id.
 *
 * On postgres this is one query for the whole list, and it reads only the
 * `state` column: boardgame.io's own `fetch` loads the whole row, the move log
 * included, which an admin list of every team would pay for twice per team.
 * The query goes through the model bgio-postgres registers on the shared
 * Sequelize, `Match` over its "Games" table, which db.postgres.test.ts pins.
 * Any other storage is asked one match at a time.
 */
export async function fetchMatchStates(db: Storage, matchIDs: string[]): Promise<Map<string, MatchState>> {
  const ids = [...new Set(matchIDs)];
  if (ids.length === 0) return new Map();
  if (db instanceof PostgresStore) {
    const rows = await db.sequelize.model("Match").findAll({
      attributes: ["id", "state"],
      where: { id: ids },
      raw: true,
    }) as unknown as { id: string; state: MatchState | null }[];
    return new Map(rows.flatMap(row => row.state ? [[row.id, row.state] as const] : []));
  }
  const fetched = await Promise.all(ids.map(async id => [id, (await db.fetch(id, { state: true })).state] as const));
  return new Map(fetched.flatMap(([id, state]) => state ? [[id, state] as const] : []));
}

const matchIDs = (team: Pick<TeamModel, MatchKind>) =>
  [team.relayMatchID, team.strategyMatchID].filter((id): id is string => id !== null);

/** Both of a team's matches, as of `now`, for the team's own routes.
 *  A row naming a match storage does not have is a broken row, and fails
 *  loudly rather than reading as a state the team could act on. */
export async function teamMatches(
  db: Storage,
  team: Pick<TeamModel, MatchKind>,
  now: Date = new Date(),
): Promise<TeamMatches> {
  const states = await fetchMatchStates(db, matchIDs(team));
  const status = (kind: MatchKind): MatchStatus => {
    const matchID = team[kind];
    if (matchID === null) return { state: "NOT STARTED" };
    const state = states.get(matchID);
    if (!state) throw new Error(`Match ${matchID} in the team's ${kind} column is not in storage.`);
    return deriveMatchStatus(kind, matchID, state, now);
  };
  return { relayMatch: status("relayMatchID"), strategyMatch: status("strategyMatchID") };
}

/**
 * The admin routes' teams: each row, and both its matches as they stand, from
 * one read of storage for the whole list.
 *
 * A match storage does not have reads as MISSING here rather than failing the
 * request, since the admin list is where an organiser finds such a team and
 * resets it. Each one is logged, so the server's log names it too.
 */
export async function adminTeamViews<T extends TeamModel>(
  db: Storage,
  teams: T[],
  now: Date = new Date(),
): Promise<(ReturnType<T["toJSON"]> & TeamMatches)[]> {
  const states = await fetchMatchStates(db, teams.flatMap(matchIDs));
  const status = (team: T, kind: MatchKind): MatchStatus => {
    const matchID = team[kind];
    if (matchID === null) return { state: "NOT STARTED" };
    const state = states.get(matchID);
    if (state) return deriveMatchStatus(kind, matchID, state, now);
    console.error(`Match ${matchID} in team ${team.teamId}'s ${kind} column is not in storage.`);
    return { state: "MISSING", matchID };
  };
  return teams.map(team => ({
    ...team.toJSON() as ReturnType<T["toJSON"]>,
    relayMatch: status(team, "relayMatchID"),
    strategyMatch: status(team, "strategyMatchID"),
  }));
}

/** {@link adminTeamViews} for one team. */
export async function adminTeamView<T extends TeamModel>(db: Storage, team: T) {
  const [view] = await adminTeamViews(db, [team]);
  return view;
}
