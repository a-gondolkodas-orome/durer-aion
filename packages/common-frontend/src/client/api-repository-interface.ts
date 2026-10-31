import type { MatchStateDto, TeamModelDto } from "./dto/TeamStateDto";
import type { RelayEndReport } from 'game';
import type { MatchMoveDispatch } from "./match-moves";

// The session is the repository's to keep, not the caller's: online it is an
// HttpOnly cookie the server set on `joinWithCode` (issue #89), which no script
// can read, so nothing here takes or returns the team's id. The match's moves
// come from `MatchMoveDispatch`, which every build extends.
export interface ClientRepository extends MatchMoveDispatch {
  version: "MOCK" | "OFFLINE" | "ONLINE"
  /** The logged-in team, or null when there is no session. */
  getTeamState(): Promise<TeamModelDto | null>;
  joinWithCode(
    code: string,
  ): Promise<void>
  logout(): Promise<void>
  startRelay(): Promise<void>
  startStrategy(): Promise<void>
  toHome(): Promise<void>
  getAll(): Promise<TeamModelDto[]>
  getMatchState(matchId: string): Promise<MatchStateDto>
  getMatchLogs(matchId: string): Promise<MatchStateDto>
  resetRelay(teamId: string): Promise<TeamModelDto>
  resetStrategy(teamId: string): Promise<TeamModelDto>
  addMinutes(matchId: string, minutes: number): Promise<string>
  // The end report of a relay whose time ran out with no move to end it: the
  // game ends a match past its time only on a move arriving after the grace
  // for late answers, and a team waiting at the buzzer sends none. Locally the
  // score toHome() records comes from the end report, so the board hands it
  // over itself. A round can then report its end again: the board's after a
  // reload, the game's own if a late ruling ends it. Only the local apps have
  // one: online the server keeps the score from the match state.
  keepRelayEnd?(report: RelayEndReport): void;

}
