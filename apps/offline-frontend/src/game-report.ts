import { relayPointsStorageKey, relayResultsStorageKey, strategyPointsStorageKey, strategyResultsStorageKey } from "common-frontend";
import { relayProblemResults } from "game";
import type { RelayReport, StrategyReport } from "game";
import { sendGameData } from "./sendData";

// The reducer's report callback for the local (offline) clients: persists the
// score of an end report and the results the home page summarises, then
// forwards to the organisers' upload channel.
// Relay end reports are persist-only — toHome() is the relay-end uploader,
// because it also covers giving up mid-match, when the reducer's onEnd never
// fires; forwarding from here too would upload a second end file.
export function handleGameReport(report: RelayReport | StrategyReport<unknown>, logStorageKey?: string) {
  if (report.phase === "end") {
    if (report.component === "relay") {
      localStorage.setItem(relayPointsStorageKey(), String(report.G.points));
      localStorage.setItem(relayResultsStorageKey(), JSON.stringify(relayProblemResults(report.G)));
      return;
    }
    localStorage.setItem(strategyPointsStorageKey(), String(report.G.points));
    localStorage.setItem(strategyResultsStorageKey(), JSON.stringify(report.G.liveResults));
  }
  sendGameData(report, logStorageKey);
}
