import { relayProblemResults, type MyGameState } from "game";
import type { RelayProblemResult } from "schemas";

/// A relay problem with each answer given, which only the admin page shows.
export interface RelayProblemDetails extends RelayProblemResult {
  answers: number[];
}

/** What the whole problem set is worth. */
export const relayMaxPoints = (problems: RelayProblemResult[]) =>
  problems.reduce((sum, it) => sum + it.maxPoints, 0);

/** Every problem of the set with the answers given to it. */
export const relayProblemDetails = (G: MyGameState): RelayProblemDetails[] =>
  relayProblemResults(G).map((result, idx) => ({
    ...result,
    answers: (G.previousAnswers[idx] ?? []).map(it => it.answer),
  }));

/** A duration as `m:ss`. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
