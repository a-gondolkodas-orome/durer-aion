// A team's progress through one of its two matches (relay, strategy). Each team
// gets one attempt per match: `allowedToStart` in the backend's
// server/team_manage.ts refuses a second start once it is IN PROGRESS or
// FINISHED, and only an admin reset takes it back to NOT STARTED.

export interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

/// A match the team can still play. Online, this and FINISHED below are read
/// off the match's own state each time a team is served (the backend's
/// server/match_status.ts) rather than stored: `endAt` is the match's `G.end`,
/// which an admin's "add minutes" moves. The offline apps build both from what
/// their local match reports (their client-repository.ts).
export interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
}

/// A match whose game has ended, or whose time is up. `score` is the match's
/// `G.points` and the results are summarised from the same state, so an answer
/// the game still judges just past the end counts when it lands. FINISHED also
/// decides navigation: the team may not start this match again and may go back
/// home.
///
/// `relayResults` and `strategyResults` are for the home page: the first on a
/// relay match, the second on a strategy match. `ChooserItem` in common-frontend
/// says when a finished match has neither.
export interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
  relayResults?: RelayProblemResult[];
  strategyResults?: LiveGameResult[];
}

/// One relay problem as the match ended: `trySeconds` has one entry per
/// answer given, how long that try took, so an empty list means the team never
/// answered it. `points` is 0 unless an answer was right.
export interface RelayProblemResult {
  maxPoints: number;
  points: number;
  trySeconds: number[];
}

/// How one live (not practice) strategy game ended, from the team's side:
/// `unfinished` is the game the time ran out in (gameWrapper's play phase
/// says when that is recorded).
export type LiveGameResult = 'won' | 'lost' | 'unfinished';

/// A match the team's row names but storage does not have. Only the admin
/// routes serve it, so that an organiser can find the team and reset it; a
/// team's own routes refuse the request instead.
export interface MissingMatchStatus {
  state: 'MISSING';
  matchID: string;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus | MissingMatchStatus;

/// Every screen a team can be on. The list is here, not just the type, because
/// the frontends validate stored team state against it.
export const PAGE_STATES = ['DISCLAIMER', 'HOME', 'RELAY', 'STRATEGY'] as const;
export type PageState = typeof PAGE_STATES[number];

export function isPageState(value: unknown): value is PageState {
  return PAGE_STATES.some(it => it === value);
}

/// A match's page shares its name with the match's game type, which
/// `allowedToStart` in the backend relies on when it compares the two.
export type GameType = Extract<PageState, 'RELAY' | 'STRATEGY'>;

/// The competition's team categories. Only the competition is held to these:
/// the relay practice site shares `TeamModelDto` with its own historical set
/// (A–E, C+…), which is why a team's `category` stays a `string`.
export const COMPETITION_CATEGORIES = ['C', 'D', 'E'] as const;
export type CompetitionCategory = typeof COMPETITION_CATEGORIES[number];

export function isCompetitionCategory(value: unknown): value is CompetitionCategory {
  return (COMPETITION_CATEGORIES as readonly unknown[]).includes(value);
}

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
  public pageState!: PageState;

  public relayMatch!: MatchStatus;
  public strategyMatch!: MatchStatus;

  public other!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
