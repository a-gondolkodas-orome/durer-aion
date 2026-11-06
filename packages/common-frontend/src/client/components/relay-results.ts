import type { RelayProblemResult } from "schemas";

/** What the whole problem set is worth. */
export const relayMaxPoints = (problems: RelayProblemResult[]) =>
  problems.reduce((sum, it) => sum + it.maxPoints, 0);

/** A duration as `m:ss`. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
