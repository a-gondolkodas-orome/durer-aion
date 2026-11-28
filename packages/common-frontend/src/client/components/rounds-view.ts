import type { MatchStatus, PageState, PublicCompetition } from 'schemas';

export type RoundType = 'relay' | 'strategy';

export interface Round {
  type: RoundType,
  status: MatchStatus,
}

/// The round a team's page is on, and the competition's other one.
export interface RoundsView {
  current: Round,
  other: Round,
}

/// What the header tells of the team's two rounds (#744): only on a round's
/// page, and only in a competition that has both. A state without a
/// competition, as a test's may be, gets nothing, as the end tables' reminder
/// does. The other round is never in progress here: a team goes home between
/// rounds, and `gohome` is refused while one runs.
export function roundsView(state: {
  pageState: PageState,
  competition?: PublicCompetition | null,
  relayMatch: MatchStatus,
  strategyMatch: MatchStatus,
} | null | undefined): RoundsView | undefined {
  if (!state?.competition?.relay || !state.competition.strategy) return undefined;
  const relay: Round = { type: 'relay', status: state.relayMatch };
  const strategy: Round = { type: 'strategy', status: state.strategyMatch };
  if (state.pageState === 'RELAY') return { current: relay, other: strategy };
  if (state.pageState === 'STRATEGY') return { current: strategy, other: relay };
  return undefined;
}
