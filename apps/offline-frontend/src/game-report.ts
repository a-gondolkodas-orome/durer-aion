import { relayPointsStorageKey, strategyPointsStorageKey } from "common-frontend";
import { sendGameData, SendGameDataParams } from "./sendData";

// The reducer's report callback for the local (offline) clients: persists the
// score of an end report, then forwards to the organisers' upload channel.
// Relay end reports are persist-only — toHome() is the relay-end uploader,
// because it also covers giving up mid-match, when the reducer's onEnd never
// fires; forwarding from here too would upload a second end file.
export function handleGameReport(report: SendGameDataParams) {
  if (report.phase === "end") {
    const key = report.component === "relay" ? relayPointsStorageKey() : strategyPointsStorageKey();
    localStorage.setItem(key, String(report.G?.points ?? 0));
    if (report.component === "relay") {
      return;
    }
  }
  sendGameData(report);
}
