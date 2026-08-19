// Which implementation owns a match's play, chosen when the match is created
// and read wherever a matchID is dispatched on (routes, closing, admin views).
// Absent means 'bgio': the statuses are JSON in a column, so every row written
// before this field existed reads as the engine that wrote it, with no ALTER
// and no backfill. 'v2' is the packages/engine + packages/competition stack
// (Phase 3 of docs/boardgame-io-replacement-plan.md).
export type MatchEngine = 'bgio' | 'v2';

export interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

export interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
  engine?: MatchEngine;
}

export interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
  engine?: MatchEngine;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus;

export class TeamModel {
  public teamId!: string;
  // Important fields
  public joinCode!: string;
  public teamName!: string;
  public category!: string;
  public credentials!: string;
  public email!: string;

  public pageState!: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY';

  public relayMatch!: MatchStatus;
  public strategyMatch!: MatchStatus;

  // Search fields
  public other!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}