import { relayProblemResults, type MyGameState } from "game";
import type { RelayProblemResult } from "schemas";

/// A relay problem with what only the match state knows: each try's time and
/// answer. The home page's copy on the team record has just the result.
export interface RelayProblemDetails extends RelayProblemResult {
  trySeconds: number[];
  answers: number[];
}

/** What the whole problem set is worth. */
export const relayMaxPoints = (problems: RelayProblemResult[]) =>
  problems.reduce((sum, it) => sum + it.maxPoints, 0);

const secondsBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);

/**
 * Every problem of the set with what the match state says of it. A problem's
 * first try is timed from the previous problem's last answer — when it
 * appeared — and each later try from the answer before it.
 */
export function relayProblemDetails(G: MyGameState): RelayProblemDetails[] {
  let shownAt = G.start;
  return relayProblemResults(G).map((result, idx) => {
    const answers = G.previousAnswers[idx] ?? [];
    const trySeconds = answers.map(it => {
      const seconds = secondsBetween(shownAt, it.date);
      shownAt = it.date;
      return seconds;
    });
    return { ...result, answers: answers.map(it => it.answer), trySeconds };
  });
}

/** A duration as `m:ss`. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
