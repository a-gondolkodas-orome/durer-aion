import { RELAY_DEFAULT_DURATION_MINUTES, STRATEGY_DEFAULT_DURATION_MINUTES } from 'game';
import type { PublicCompetition } from 'schemas';

/// The numbers the home screen tells of a relay before it starts.
export interface RelayNumbers {
  minutes: number;
  /// Points: all problems together, and the least and most one is worth.
  total: number;
  min: number;
  max: number;
}

/// The online relay's as of the 20th edition: 9 problems worth 3 to 6 points,
/// 40 in all. The local apps serve no competition and run this relay.
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
