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
  /** `ctx.durer_transport.getMatchQueue` — the queue the bot's moves run on. */
  queueFor: (matchID: string) => MatchQueue;
  /** `ctx.durer_transport.pubSub` — where the team's open board is told. */
  pubSub: Parameters<typeof TransportAPI>[3];
}

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
 * gave up on — reports `already-granted` and writes nothing.
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

  // Strategy first, as the handler this replaces did: a team with both running
  // is a bug of its own, and this keeps which one wins unchanged.
  const side = team.strategyMatch.state === "IN PROGRESS" ? "strategyMatch"
    : team.relayMatch.state === "IN PROGRESS" ? "relayMatch"
      : null;
  if (side === null) return refused({ kind: "no-match-running" });

  const running = team[side] as InProgressMatchStatus;
  if (running.matchID !== matchID) return refused({ kind: "other-match-running", running: running.matchID });

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

  // One write rather than two: the match's new end and the note that records it
  // are the same fact, and `other`'s validator runs on every save either way.
  // The note is dropped rather than the extension when the field is full —
  // `appendOtherNote` in model.ts says why, and a grant whose note did not fit
  // is a grant a repeat will apply again, which is the safe way round.
  await team.update({
    [side]: { state: "IN PROGRESS", matchID, startAt: new Date(newState.G.start), endAt },
    other: appendOtherNote(team.other, noteFor(matchID, minutes, grant)),
  });
  await db.setState(matchID, newState);

  // The team's board is told the way the socket transport tells it, which is
  // what makes the new clock show without a reload. `socketio_botmoves.ts` has
  // the mechanism; only `sendAll` is used, so there is no socket to pass.
  TransportAPI(matchID, null, getFilterPlayerView(game), clock.pubSub)
    .sendAll({ type: "update", args: [matchID, newState] });

  return { status: "extended", matchID, team, endAt };
}
