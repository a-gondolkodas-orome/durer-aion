export interface TeamModelDto {
  id: string;
  joinCode: string;
  teamName: string;
  category: string;
  credentials: string;
  email: string;
  pageState: 'HOME'|'RELAY'|'STRATEGY'|'FINISHED'
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
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
