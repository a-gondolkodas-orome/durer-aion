// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { relayPointsStorageKey } from "common-frontend/core";
import { sendGameData, SendGameDataParams } from "./sendData";
import { readStoredTeamState } from "./stored-team-state";
import { trackRelayFinished } from "./tracking";

// The reducer's report callback for the local client: persists the score of
// an end report and counts it as a finished round in umami, then forwards to
// the organisers' upload channel. End reports
// are persist-only — toHome() is the relay-end uploader, because it also
// covers giving up mid-match, when the reducer's onEnd never fires;
// forwarding from here too would upload a second end file.
export function handleGameReport(report: SendGameDataParams) {
  if (report.phase === "end" && report.component === "relay") {
    const points = report.G?.points ?? 0;
    // A round can report its end twice: the board hands over a timed-out
    // round's report as its end dialog opens, again after a reload, and the
    // game's own follows if a late ruling then ends it. Each stores its score,
    // but only the first counts as a finish; logging out to the round
    // selector clears the score for the next round.
    const finishedBefore = localStorage.getItem(relayPointsStorageKey()) !== null;
    localStorage.setItem(relayPointsStorageKey(), String(points));
    // The stored state is null only when storage was cleared or corrupted
    // mid-round; the finish then goes untracked rather than mislabelled.
    const team = readStoredTeamState();
    if (team && !finishedBefore) {
      trackRelayFinished(team.teamName, points);
    }
    return;
  }
  sendGameData(report);
}
