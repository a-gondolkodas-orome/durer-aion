import type { State, StorageAPI } from "boardgame.io";
import { PostgresStore } from "bgio-postgres";
import { relayProblemResults, type GameStateMixin, type MyGameState } from "game";
import type { AdminMatchStatus, FinishedMatchStatus, GameType, InProgressMatchStatus, MatchStatus } from "schemas";
import type { TeamModel } from "./model";

/** The team row's two match columns. Each holds the id of the team's current
 *  match of that kind, or null before it starts and after an admin reset. */
export type MatchKind = "relayMatchID" | "strategyMatchID";

export interface TeamMatches {
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

/** {@link TeamMatches} as the admin routes see them, a broken row included. */
export interface AdminTeamMatches {
  relayMatch: AdminMatchStatus;
  strategyMatch: AdminMatchStatus;
}

/**
 * A team's own request refused because its row names a match storage does not
 * have. koa answers with `status` and, as `expose` is set, with the message,
 * which is the team's to read. Not a 500: nothing failed on this request, and
 * the organisers find the row marked on the admin list.
 */
export class BrokenTeamRowError extends Error {
  readonly status = 409;
  readonly expose = true;
  constructor() {
    super("A csapat egyik játéka nem található. Kérjük, hívjatok egy szervezőt!");
  }
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
  gameType: GameType,
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
  if (gameType === "RELAY")
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
  if (matchIDs.length === 0) return new Map();
  const rows = db instanceof PostgresStore
    ? await db.sequelize.model("Match").findAll({
      attributes: ["id", "state"],
      where: { id: matchIDs },
      raw: true,
    }) as unknown as { id: string; state?: MatchState }[]
    : await Promise.all(matchIDs.map(async id => ({ id, state: (await db.fetch(id, { state: true })).state })));
  return new Map(rows.flatMap(({ id, state }) => state ? [[id, state] as const] : []));
}

const matchIDs = (team: Pick<TeamModel, MatchKind>) =>
  [team.relayMatchID, team.strategyMatchID].filter((id): id is string => id !== null);

/** A team's two matches, from states already read. A row naming a match
 *  storage does not have reads as BROKEN, which only the admin routes pass on:
 *  {@link teamMatches} refuses it. */
function matchesOf(team: Pick<TeamModel, MatchKind>, states: Map<string, MatchState>, now: Date): AdminTeamMatches {
  const status = (column: MatchKind, gameType: GameType): AdminMatchStatus => {
    const matchID = team[column];
    if (matchID === null) return { state: "NOT STARTED" };
    const state = states.get(matchID);
    if (!state) return { state: "BROKEN", matchID };
    return deriveMatchStatus(gameType, matchID, state, now);
  };
  return { relayMatch: status("relayMatchID", "RELAY"), strategyMatch: status("strategyMatchID", "STRATEGY") };
}

/** Both of a team's matches, as of `now`, for the team itself: a broken row
 *  throws {@link BrokenTeamRowError} rather than reading as a state the team
 *  could act on. */
export async function teamMatches(
  db: Storage,
  team: Pick<TeamModel, MatchKind>,
  now: Date = new Date(),
): Promise<TeamMatches> {
  const { relayMatch, strategyMatch } = matchesOf(team, await fetchMatchStates(db, matchIDs(team)), now);
  if (relayMatch.state === "BROKEN" || strategyMatch.state === "BROKEN")
    throw new BrokenTeamRowError();
  return { relayMatch, strategyMatch };
}

/** The admin routes' teams: each row, and both its matches as they stand, from
 *  one read of storage for the whole list. A broken row is marked BROKEN, so it
 *  costs the list nothing but its own match. */
export async function adminTeamViews(
  db: Storage,
  teams: TeamModel[],
): Promise<(ReturnType<TeamModel["toJSON"]> & AdminTeamMatches)[]> {
  const states = await fetchMatchStates(db, teams.flatMap(matchIDs));
  const now = new Date();
  return teams.map(team => ({ ...team.toJSON(), ...matchesOf(team, states, now) }));
}

/** {@link adminTeamViews} for one team. */
export async function adminTeamView(db: Storage, team: TeamModel) {
  const [view] = await adminTeamViews(db, [team]);
  return view;
}
