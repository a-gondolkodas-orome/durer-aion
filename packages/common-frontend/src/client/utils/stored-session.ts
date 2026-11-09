import { bgioStoragePrefix, lastActiveStorageKey, relayPointsStorageKey, relayResultsStorageKey, strategyPointsStorageKey, strategyResultsStorageKey, teamStateStorageKey } from "./storage-keys";

// Everything this browser keeps of a team: its stored login, scores and saved
// matches. A logout removes it, and so does a local client's login expiring —
// another team may be next at this computer, and must not walk into this one's
// match. The login marker is not part of it: the caller removes that last,
// once the session is really over (user-model.ts says why).
export function clearStoredSession() {
  localStorage.removeItem(teamStateStorageKey());
  localStorage.removeItem(lastActiveStorageKey());
  localStorage.removeItem(relayPointsStorageKey());
  localStorage.removeItem(strategyPointsStorageKey());
  localStorage.removeItem(relayResultsStorageKey());
  localStorage.removeItem(strategyResultsStorageKey());
  // Collect first, remove after: removeItem inside a key(idx) loop shifts the
  // remaining keys down, so every key right after a removed one is skipped.
  const keys = [...Array(localStorage.length).keys()]
    .map(idx => localStorage.key(idx))
    .filter((key): key is string => key !== null && key.startsWith(bgioStoragePrefix()));
  keys.forEach(key => localStorage.removeItem(key));
}
