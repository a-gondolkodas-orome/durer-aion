import { Ctx } from "boardgame.io";
import { MyGameState } from "../../games/relay/game";

export interface TeamModelDto {
  teamId: string;
  joinCode: string;
  teamName: string;
  category: string;
  credentials: string;
  email: string;
  pageState: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY'
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

export interface MatchStateDto {
  G: MyGameState;
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
