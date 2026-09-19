import type { StorageAPI } from "boardgame.io";
import { getFilterPlayerView } from "boardgame.io/internal";
import type { AnyBgioGame } from "game";
import type { InProgressMatchStatus } from "schemas";
import { TransportAPI } from "../socketio_botmoves";
import type { TeamsRepository } from "./db";
import { appendOtherNote, type TeamModel } from "./model";

/** Why a match was not given more time. */
export type ExtendRefusal =
  | { kind: "match-not-found" }
  | { kind: "team-not-found"; teamId: string }
  | { kind: "other-match-running"; running: string }
  | { kind: "no-match-running" }
  | { kind: "game-not-found"; gameName: string };

export type ExtendResult =
  | { status: "extended"; matchID: string; team: TeamModel; endAt: Date }
  | { status: "already-granted"; matchID: string; team: TeamModel; endAt: Date }
  | { status: "refused"; matchID: string; reason: ExtendRefusal };

/** The per-match queue boardgame.io serialises a match's writes on. Named
 *  structurally so a test can hand over something simpler than a PQueue. */
export interface MatchQueue {
  add: <T>(task: () => Promise<T>) => Promise<T>;
}

export interface MatchClock {
  db: StorageAPI.Async | StorageAPI.Sync;
  teams: TeamsRepository;
  games: AnyBgioGame[];
  /** `ctx.durer_transport.getMatchQueue` — the queue the bot's moves run on.
   *
   * boardgame.io hands out a queue per match and drops it when the match's last
   * client disconnects, so the queue is an object with a lifetime rather than a
   * name: a disconnect and a reconnect inside one extension's window leave the
   * extension on the old queue and the returning player's move on a new one,
   * with nothing between them. Nothing here can close that without owning the
   * map, and a disconnected player is not moving; what it costs is the window,
   * not the mechanism. Asking for a queue also creates one when the match has
   * no client at all — an empty PQueue that only a later disconnect removes,
   * which is a few hundred bytes per running match. */
  queueFor: (matchID: string) => MatchQueue;
  /** `ctx.durer_transport.pubSub` — where the team's open board is told. */
  pubSub: Parameters<typeof TransportAPI>[3];
}

/**
 * The most one extension may move a clock, in either direction.
 *
 * A bound rather than only a whole-number check: `setMinutes` turns a large
 * enough number into an Invalid Date, which throws on the way out of
 * `toISOString` — the very failure refusing a fractional number was meant to
 * stop, and `Number.isInteger(1e21)` is true. A day is far longer than a round,
 * so past it is a typo, and this is the one operation that reaches every
 * running match at once.
 */
export const MINUTES_LIMIT = 24 * 60;

/** Minutes an extension may be asked for. Negative is not a typo: taking time
 *  back is the same operation. */
export const isMinutes = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && Math.abs(value) <= MINUTES_LIMIT;

/**
 * A grant that can be recorded against the matches it moves.
 *
 * Bounded because the record is a note in `other`, which holds the organisers'
 * own text and has a length (`OTHER_MAX_LENGTH` in model.ts): a grant long
 * enough to push the note past it is a grant nothing records, and an unrecorded
 * grant is one a retry applies a second time — the opposite of what a grant is
 * for. The charset keeps the trail readable, since `[`, `]` and spaces are what
 * delimit a note from its neighbours.
 */
export const isGrant = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(value);

/** What one extension writes into the team's notes, and what a repeat of the
 *  same grant looks for. The match id is part of it so a grant applied to a
 *  team with two matches running is not taken for the other one. */
export const grantMarker = (matchID: string, grant: string) => `te[${matchID}#${grant}]`;

const noteFor = (matchID: string, minutes: number, grant: string | undefined) =>
  `${grant === undefined ? `te[${matchID}]` : grantMarker(matchID, grant)}:${minutes}`;

/**
 * Gives one running match `minutes` more, and tells the team's open board.
 *
 * On the match's own queue, and re-read inside it. The handler this came from
 * fetched the state, computed `_stateID + 1` from it and wrote that back with
 * no lock — and `bgio-postgres`' `setState` only writes when the stored id is
 * strictly lower, so a move landing in between made the whole extension vanish
 * with no error while the route still answered 200. The bot's moves already run
 * on this queue (`socketio_botmoves.ts`), so sharing it is what makes the
 * read-modify-write safe.
 *
 * Everything that can refuse is decided before anything is written, which the
 * old ordering did not do: it moved the clock, then looked for the game.
 *
 * `grant` makes a repeat safe. The note it leaves in `other` is the record, so
 * the same grant asked for twice — a request the server finished and the browser
 * gave up on — reports `already-granted` and writes nothing. The note is written
 * after the clock has actually moved, so the record is of an extension that
 * happened rather than one that was attempted.
 */
export async function addMinutesToMatch(
  clock: MatchClock,
  { matchID, minutes, grant }: { matchID: string; minutes: number; grant?: string },
): Promise<ExtendResult> {
  return await clock.queueFor(matchID).add(() => extend(clock, matchID, minutes, grant));
}

async function extend(
  clock: MatchClock,
  matchID: string,
  minutes: number,
  grant: string | undefined,
): Promise<ExtendResult> {
  const { db, teams, games } = clock;
  const refused = (reason: ExtendRefusal): ExtendResult => ({ status: "refused", matchID, reason });

  const { state, metadata } = await (db as StorageAPI.Async).fetch(matchID, { state: true, metadata: true });
  if (!state) return refused({ kind: "match-not-found" });

  // The team's GUID is the match's player name, which boardgame.io types as
  // optional because a slot is unnamed until someone joins it. A match the
  // server made always has one (`team_manage.ts`), so no name means no team.
  const teamId = metadata.players[0].name;
  const team = teamId === undefined ? null : await teams.getTeam({ teamId });
  if (!team) return refused({ kind: "team-not-found", teamId: teamId ?? "(no player on the match)" });

  // Resolved by the id asked for rather than by looking at one side first: a
  // team can have both running (they are started by separate requests with
  // nothing serialising them), and picking a side before comparing ids refused
  // whichever one was asked about second.
  const sides = ["relayMatch", "strategyMatch"] as const;
  const side = sides.find(
    candidate => team[candidate].state === "IN PROGRESS"
      && team[candidate].matchID === matchID);
  if (side === undefined) {
    const other = sides.find(candidate => team[candidate].state === "IN PROGRESS");
    return refused(other === undefined
      ? { kind: "no-match-running" }
      : { kind: "other-match-running", running: (team[other] as InProgressMatchStatus).matchID });
  }
  const running = team[side] as InProgressMatchStatus;

  const game = games.find(candidate => candidate.name === metadata.gameName);
  if (!game) return refused({ kind: "game-not-found", gameName: metadata.gameName });

  if (grant !== undefined && (team.other ?? "").includes(grantMarker(matchID, grant))) {
    return { status: "already-granted", matchID, team, endAt: new Date(running.endAt) };
  }

  const endAt = new Date(state.G.end);
  endAt.setMinutes(endAt.getMinutes() + minutes);
  const newState = {
    ...state,
    // The state a move would have written next. Reading and writing it inside
    // the queue is what makes claiming it safe.
    _stateID: state._stateID + 1,
    G: { ...state.G, end: endAt.toISOString(), millisecondsRemaining: endAt.getTime() - Date.now() },
  };

  // The clock first, then the row describing it. Nothing spans the two stores,
  // so a failure between them leaves them apart, and the order decides what
  // that costs. `G.end` is what the team's own clock counts down to
  // (`gamewrapper.ts`); the row is what the organisers read, and the note is
  // the grant's record. Writing the state first leaves a failure showing as a
  // row behind the clock, and leaves no grant recorded for minutes nobody got
  // — the other order wrote the grant for a state write that then failed, and
  // `already-granted` refused the very repeat that would have healed it.
  //
  // What is left is a row write failing after the clock moved: the walk reports
  // that team and a repeat moves it again. That window is the narrower of the
  // two — this is an update on a row already in hand, where `setState` fetches
  // and writes a whole match — and a second extension the organiser was told
  // about beats a first one silently refused.
  await db.setState(matchID, newState);

  // One write rather than two: the match's new end and the note that records it
  // are the same fact, and `other`'s validator runs on every save either way.
  // The note is dropped rather than the extension when the field is full —
  // `appendOtherNote` in model.ts says why, and a grant whose note did not fit
  // is a grant a repeat will apply again, which is the safe way round.
  await team.update({
    [side]: { state: "IN PROGRESS", matchID, startAt: new Date(newState.G.start), endAt },
    other: appendOtherNote(team.other, noteFor(matchID, minutes, grant)),
  });

  // The team's board is told the way the socket transport tells it, which is
  // what makes the new clock show without a reload. `socketio_botmoves.ts` has
  // the mechanism; only `sendAll` is used, so there is no socket to pass.
  TransportAPI(matchID, null, getFilterPlayerView(game), clock.pubSub)
    .sendAll({ type: "update", args: [matchID, newState] });

  return { status: "extended", matchID, team, endAt };
}

/** Why one team's match was left out of a bulk extension. `error` is a throw
 *  rather than a decision; the rest are {@link ExtendRefusal}'s own kinds. */
export type BulkProblem = ExtendRefusal["kind"] | "error";

/** What one grant did, by team name — which is what an organiser reads. */
export interface BulkExtendResult {
  extended: string[];
  alreadyGranted: string[];
  problems: { teamName: string; matchID: string; reason: BulkProblem }[];
}

/**
 * Gives every running match `minutes` more, under one grant.
 *
 * This used to be a loop in the admin page, over a team list the browser held.
 * Two things could not be fixed from out there. The list is a snapshot and
 * nothing polls it, so it called matches running that had finished long before
 * and the server refused each of those; and a request per team cannot serialise
 * against the bot's moves, which is the race {@link addMinutesToMatch} exists to
 * close. Walking here reads the list as it is and puts every write on its
 * match's own queue.
 *
 * Sequential: a match at a time, each holding only its own queue. Firing them
 * together would be a few hundred read-modify-writes at once against the one
 * backend container, for an operation nobody is watching the latency of.
 *
 * One match's failure never ends the walk — that was the defect this replaces,
 * where the first refusal cost every later team its minutes and the organiser
 * was told only that an error happened.
 */
export async function addMinutesToEveryRunningMatch(
  clock: MatchClock,
  { minutes, grant }: { minutes: number; grant: string },
): Promise<BulkExtendResult> {
  const result: BulkExtendResult = { extended: [], alreadyGranted: [], problems: [] };

  for (const team of await clock.teams.listTeams() ?? []) {
    for (const side of ["relayMatch", "strategyMatch"] as const) {
      const match = team[side];
      if (match.state !== "IN PROGRESS") continue;
      const { matchID } = match;
      const teamName = team.teamName;

      try {
        const outcome = await addMinutesToMatch(clock, { matchID, minutes, grant });
        if (outcome.status === "extended") result.extended.push(teamName);
        else if (outcome.status === "already-granted") result.alreadyGranted.push(teamName);
        else result.problems.push({ teamName, matchID, reason: outcome.reason.kind });
      } catch {
        // A throw is one match's problem, not the round's. What it was is in
        // the server's own log; the organiser needs to know which team to look at.
        result.problems.push({ teamName, matchID, reason: "error" });
      }
    }
  }

  return result;
}
