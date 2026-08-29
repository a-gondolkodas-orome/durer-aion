// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { relayPointsStorageKey } from "common-frontend";
import { sendGameData, SendGameDataParams } from "./sendData";

// The reducer's report callback for the local client: persists the score of
// an end report, then forwards to the organisers' upload channel. End reports
// are persist-only — toHome() is the relay-end uploader, because it also
// covers giving up mid-match, when the reducer's onEnd never fires;
// forwarding from here too would upload a second end file.
export function handleGameReport(report: SendGameDataParams) {
  if (report.phase === "end" && report.component === "relay") {
    localStorage.setItem(relayPointsStorageKey(), String(report.G?.points ?? 0));
    return;
  }
  sendGameData(report);
}
