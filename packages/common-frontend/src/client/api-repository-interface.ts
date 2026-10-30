import type { MatchStateDto, TeamModelDto } from "./dto/TeamStateDto";
import type { BoardProps } from 'boardgame.io/react';
import type { RelayEndReport } from 'game';

// The relay match is judged and timed where it runs — on the server online,
// by the local bot offline — so the board's actions stay boardgame.io moves
// in both builds. The board hands over its whole `moves` prop, which
// boardgame.io types as a plain string-keyed record, and the repository owns
// knowing which move carries each action.
export type BoardMoves = BoardProps['moves'];

// The session is the repository's to keep, not the caller's: online it is an
// HttpOnly cookie the server set on `joinWithCode` (issue #89), which no script
// can read, so nothing here takes or returns the team's id.
export interface ClientRepository {
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
  submitRelayAnswer(answer: number, moves: BoardMoves): Promise<void>;
  // Unlike startRelay, which moves the team to the relay page, this dispatches
  // the opening move of the match once the board is up.
  startRelayGame(moves: BoardMoves): Promise<void>;
  syncRelayTime(moves: BoardMoves): Promise<void>;
  // The end report of a relay whose time ran out with no move to end it: the
  // game ends a match past its time only on a move arriving after the grace
  // for late answers, and a team waiting at the buzzer sends none. Locally the
  // score toHome() records comes from the end report, so the board hands it
  // over itself. Only the local apps have one: online the server keeps the
  // score from the match state.
  keepRelayEnd?(report: RelayEndReport): void;

}
