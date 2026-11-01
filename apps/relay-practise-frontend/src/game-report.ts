// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { relayPointsStorageKey } from "common-frontend/core";
import type { RelayReport } from "game";
import { readStoredTeamState } from "./stored-team-state";
import { trackRelayFinished } from "./tracking";

// The reducer's report callback for the local client: persists the score of
// an end report and counts it as a finished round in umami. A step report
// needs nothing here.
export function handleGameReport(report: Pick<RelayReport, "component" | "phase"> & { G: { points: number } }) {
  if (report.phase !== "end") {
    return;
  }
  const points = report.G.points;
  // A round can report its end more than once (see
  // ClientRepository.keepRelayEnd): each stores its score, but only the
  // first counts as a finish. startRelay() starts a round with none stored.
  const finishedBefore = localStorage.getItem(relayPointsStorageKey()) !== null;
  localStorage.setItem(relayPointsStorageKey(), String(points));
  // The stored state is null only when storage was cleared or corrupted
  // mid-round; the finish then goes untracked rather than mislabelled.
  const team = readStoredTeamState();
  if (team && !finishedBefore) {
    trackRelayFinished(team.teamName, points);
  }
}
