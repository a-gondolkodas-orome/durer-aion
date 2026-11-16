import { RELAY_DEFAULT_DURATION_MINUTES, STRATEGY_DEFAULT_DURATION_MINUTES, STRATEGY_POINTS_BY_LOSSES } from 'game';
import type { PublicCompetition, StartWindow } from 'schemas';

/// The numbers the home screen tells of a relay before it starts.
export interface RelayNumbers {
  minutes: number;
  /// Points: all problems together, and the least and most one is worth.
  total: number;
  min: number;
  max: number;
}

/// The online relay's as of the 20th edition: 9 problems worth 3 to 6 points,
/// 40 in all.
const RELAY_FALLBACK = {
  minutes: RELAY_DEFAULT_DURATION_MINUTES,
  problemPoints: [3, 3, 4, 4, 4, 5, 5, 6, 6],
};

/// From the team's competition; without one, as `RELAY_FALLBACK` says.
export function relayNumbers(competition?: PublicCompetition | null): RelayNumbers {
  const relay = competition?.relay;
  const minutes = relay?.durationMinutes ?? RELAY_FALLBACK.minutes;
  const points = relay?.problemPoints.length ? relay.problemPoints : RELAY_FALLBACK.problemPoints;
  return {
    minutes,
    total: points.reduce((sum, each) => sum + each, 0),
    min: Math.min(...points),
    max: Math.max(...points),
  };
}

/// The strategy match's length, as `relayNumbers`.
export function strategyMinutes(competition?: PublicCompetition | null): number {
  return competition?.strategy?.durationMinutes ?? STRATEGY_DEFAULT_DURATION_MINUTES;
}

/// The most a team can score in its competition: every relay problem, and the
/// strategy match without a loss, of the matches it has.
export function maxPoints(competition: PublicCompetition): number {
  const relay = competition.relay?.problemPoints.reduce((sum, each) => sum + each, 0) ?? 0;
  return relay + (competition.strategy === undefined ? 0 : STRATEGY_POINTS_BY_LOSSES[0]);
}

/// When the competing time ends: the last moment a match started inside the
/// window still runs, which is its close plus the longer of the matches.
/// Minutes an organiser adds can run past it. Without a close there is none.
export function competingEnd(
  startWindow: StartWindow | null | undefined, competition: PublicCompetition,
): Date | undefined {
  if (startWindow?.closesAt === undefined) return undefined;
  const longest = Math.max(competition.relay?.durationMinutes ?? 0, competition.strategy?.durationMinutes ?? 0);
  return new Date(Date.parse(startWindow.closesAt) + longest * 60_000);
}
