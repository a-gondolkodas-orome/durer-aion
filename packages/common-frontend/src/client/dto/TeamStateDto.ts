import type { Ctx } from "boardgame.io";
import type { GameStateMixin, MyGameState as RelayGameState } from "game";
import type { MatchStatus, PageState, TeamTsvProblem, TeamTsvProblemCode } from "schemas";

export { isPageState, type CompetitionCategory, type PageState } from "schemas";

/// `teamId`, `joinCode` and `email` are optional because only the
/// authenticated admin routes serve them: `GET /team/me` answers a team with
/// everything but its secrets, so no component the team sees may depend on
/// these three. `teamId` is among them because the GUID *is* the session
/// cookie's value — see `server/team_view.ts` in the backend.
export interface TeamModelDto {
  teamId?: string;
  joinCode?: string;
  teamName: string;
  category: string;
  credentials: string;
  email?: string;
  pageState: PageState
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

/// The GUID of a team an admin page is acting on. Optional on the DTO because
/// the team's own state leaves it out, but every row the authenticated admin
/// routes serve carries it — so its absence here is a bug, not a case to
/// render around, and the surrounding handlers report the throw.
export function adminTeamId(team: TeamModelDto): string {
  if (team.teamId === undefined) {
    throw new Error(`A(z) ${team.teamName} csapat azonosítója hiányzik.`);
  }
  return team.teamId;
}

/// What a team import did, and everything wrong with the file it was given.
/// The rows that get written are written together or not at all, so `imported`
/// is either all of them or zero — and it is zero in three quite different
/// cases, which `refused` and `accepted` tell apart: the file was refused, it
/// was a dry run, or every team in it was already there.
export interface ImportResultDto {
  imported: number;
  /// Rows naming a team that is already there. Left exactly as they are: an
  /// import never modifies a live team, it only adds the ones that are missing.
  accepted: number;
  /// The file was not loaded and nothing was written.
  refused: boolean;
  rows: number;
  /// Errors first, then warnings, each in the order of the file.
  problems: TeamTsvProblem[];
  /// Problems past the server's caps, which are not in `problems`.
  problemsTruncated: number;
  /// Data rows holding at least one error. Counted before the cap, so it is
  /// the file's own number even when `problems` does not list them all.
  badRows: number;
  /// Warnings of each code the file drew, counted before the caps — so a row
  /// collapsing repeats into one line can say how many there really were.
  warningCounts: Partial<Record<TeamTsvProblemCode, number>>;
  /// The teams of a load that wrote something, in `TEAM_IMPORT_HEADER` order
  /// and the file's own order. The only copy of the join codes the import
  /// generated, which is why the page hands it to the browser to save rather
  /// than only offering to. Empty when nothing was written.
  exportTable: string[][];
}

/// One admin endpoint serves both kinds of match, and the payload carries no
/// discriminant of its own: a relay match's G is the relay game state, a
/// strategy match's is whatever the game defines plus gameWrapper's mixin — of
/// which only the mixin half is common to every strategy game. A reader tells
/// the two apart by a field only one of them has.
export interface MatchStateDto {
  G: RelayGameState | GameStateMixin;
  ctx:	Ctx;
  deltalog:	MatchStateLogDto[];
}

export interface MatchStateLogDto {
  action: 'MAKE_MOVE' | 'GAME_EVENT' | 'UNDO' | 'REDO';
  _stateID:	number;
  turn:	number;
  phase: string;
  redact: boolean;
  automatic: boolean;
}

export type { FinishedMatchStatus, InProgressMatchStatus, LiveGameResult, MatchStatus, NotStartedMatchStatus, RelayProblemResult } from "schemas";
