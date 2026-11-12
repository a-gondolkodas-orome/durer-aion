import { bgioStoragePrefix, lastActiveStorageKey, relayPointsStorageKey, relayResultsStorageKey, strategyPointsStorageKey, strategyResultsStorageKey, teamStateStorageKey } from "./storage-keys";

// Counts the calls to `clearStoredSession`: which stored session the page is in.
let session = 0;

/// Memoizes `build` per key for as long as the stored session lasts, and builds
/// afresh once `clearStoredSession` has run.
///
/// It is for a local app's game clients. boardgame.io keeps a local match's
/// master in memory for the page's lifetime, keyed by the client's game object
/// (local-with-bots.ts), so clearing the saved match does not end it: a client
/// built once per page would hand the next team on this tab the previous
/// team's match. A client built per session has a new game object, hence a new
/// master, reading the cleared storage; within the session every mount gets
/// the same client, so a remount does not start a second master on one match.
export function perStoredSession<K, V>(build: (key: K) => V): (key: K) => V {
  let builtIn = session;
  const built = new Map<K, V>();
  return (key: K) => {
    if (builtIn !== session) {
      builtIn = session;
      built.clear();
    }
    if (!built.has(key)) {
      built.set(key, build(key));
    }
    return built.get(key) as V;
  };
}

// Everything this browser keeps of a team: its stored login, scores and saved
// matches. A logout removes it, and so does a local client's login expiring —
// another team may be next at this computer, and must not walk into this one's
// match. The login marker is not part of it: the caller removes that last,
// once the session is really over (user-model.ts says why).
export function clearStoredSession() {
  session += 1;
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
