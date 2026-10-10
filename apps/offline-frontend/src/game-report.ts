import { relayPointsStorageKey, relayResultsStorageKey, strategyPointsStorageKey, strategyResultsStorageKey } from "common-frontend";
import { relayProblemResults } from "game";
import { sendGameData, SendGameDataParams } from "./sendData";

// The reducer's report callback for the local (offline) clients: persists the
// score of an end report and the results the home page summarises, then
// forwards to the organisers' upload channel.
// Relay end reports are persist-only — toHome() is the relay-end uploader,
// because it also covers giving up mid-match, when the reducer's onEnd never
// fires; forwarding from here too would upload a second end file.
export function handleGameReport(report: SendGameDataParams, logStorageKey?: string) {
  if (report.phase === "end") {
    const key = report.component === "relay" ? relayPointsStorageKey() : strategyPointsStorageKey();
    localStorage.setItem(key, String(report.G?.points ?? 0));
    const G = report.G;
    if (report.component === "relay") {
      if (G?.maxPointsList) {
        localStorage.setItem(relayResultsStorageKey(), JSON.stringify(relayProblemResults(G)));
      }
      return;
    }
    if (G?.liveResults) {
      localStorage.setItem(strategyResultsStorageKey(), JSON.stringify(G.liveResults));
    }
  }
  sendGameData(report, logStorageKey);
}
