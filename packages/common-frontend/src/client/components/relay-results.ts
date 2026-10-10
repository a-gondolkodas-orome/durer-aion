import { relayProblemResults, type MyGameState } from "game";
import type { RelayProblemResult } from "schemas";

/// One column of a relay results table. `seconds` and `trySeconds` exist only
/// where the match state is at hand: the home page's copy on the team record
/// leaves them out, as it leaves out the answers only the admin table shows.
export interface RelayProblemRow extends RelayProblemResult {
  seconds?: number;
  trySeconds?: number[];
  answers?: number[];
}

/// How a problem ended, which picks its cell's colour: the try a right answer
/// came on, every try wrong, or no answer at all — reached too late or never.
export type RelayOutcome = { solvedOnTry: number } | "wrong" | "unanswered";

export function relayOutcome(problem: RelayProblemResult): RelayOutcome {
  if (problem.tries === 0) {
    return "unanswered";
  }
  return problem.points > 0 ? { solvedOnTry: problem.tries } : "wrong";
}

/** What the whole problem set is worth. */
export const relayMaxPoints = (problems: RelayProblemResult[]) =>
  problems.reduce((sum, it) => sum + it.maxPoints, 0);

const secondsBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);

/**
 * Every problem of the set with what the match state says of it. A problem's
 * time runs from the previous problem's last answer — when it appeared — to
 * its own last answer; each try's, from the answer before it.
 */
export function relayProblemRows(G: MyGameState): RelayProblemRow[] {
  let shownAt = G.start;
  return relayProblemResults(G).map((result, idx) => {
    const answers = G.previousAnswers[idx] ?? [];
    const row: RelayProblemRow = { ...result, answers: answers.map(it => it.answer) };
    if (answers.length > 0) {
      let previous = shownAt;
      row.trySeconds = answers.map(it => {
        const seconds = secondsBetween(previous, it.date);
        previous = it.date;
        return seconds;
      });
      row.seconds = secondsBetween(shownAt, previous);
      shownAt = previous;
    }
    return row;
  });
}

/** `m:ss`, the way the countdown shows time. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
