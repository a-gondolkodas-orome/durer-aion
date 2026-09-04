import { Ctx } from "boardgame.io";
import { GameStateMixin, MyGameState as RelayGameState } from "game";

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
  pageState: 'DISCLAIMER' | 'HOME' | 'RELAY' | 'STRATEGY'
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

export interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
}

export interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

export interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus;
