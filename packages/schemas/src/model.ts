// A team's progress through one of its two matches (relay, strategy). Each team
// gets one attempt per match: `allowedToStart` in the backend's
// server/team_manage.ts refuses a second start once it is IN PROGRESS or
// FINISHED, and only an admin reset takes it back to NOT STARTED.

export interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

/// Set when the match is created. `endAt` mirrors the match's `G.end`, which an
/// admin can push later with "add minutes" — only while the match is here.
export interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
}

/// Set by `closeMatch`, either when boardgame.io reports the game over or when
/// the team's state is read after `endAt` has passed. FINISHED only decides
/// navigation: the team may not start this match again and may go back home.
///
/// It does not freeze the result. `score` is a copy of `G.points` taken when
/// the match was closed, and a game still accepts some moves shortly after
/// `G.end` (each game's `onMove`/`onEnd` says which), so `G.points` can grow
/// after an early close. A later game over closes the match again and
/// overwrites the copy; a match that never reaches game over keeps it.
/// `G.points` in the match state is the result — `scripts/admin.py` scores
/// from it and reports where `score` disagrees.
export interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus;

export class TeamModel {
  public teamId!: string;
  public joinCode!: string;
  public teamName!: string;
  public category!: string;
  public credentials!: string;
  public email!: string;

  /// Which screen the team sees. DISCLAIMER until it accepts the rules, then
  /// HOME; starting a match moves it to that match's page, and it stays there
  /// after the match finishes until the team goes home, which the server
  /// refuses while either match is IN PROGRESS.
  public pageState!: 'DISCLAIMER' | 'HOME' | 'RELAY' | 'STRATEGY';

  public relayMatch!: MatchStatus;
  public strategyMatch!: MatchStatus;

  public other!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
