// cspell:ignore aegnjrlearnjla
// This module stays import-free: the unit tests load it without the workspace
// packages' dist builds, which the CI test job does not produce.

// The two names the apps have always used; their historical homes re-export
// them.
export const LOCAL_STORAGE_TEAMSTATE = "aegnjrlearnjla";
export const BGIO_LOCALSTORAGE_PREFIX = "bgio_";

// gyakorlo.durerinfo.hu serves more than one of these apps from a single
// origin, so they share one localStorage: with the same keys, a login in one
// app leaks into the other, and one app's logout wipes the other's saved
// matches. An app that shares its origin sets a namespace before rendering;
// the empty default keeps the historical keys (and the already-saved sessions)
// of the apps deployed without one.
let namespace = "";

export function setLocalStorageNamespace(appName: string) {
  namespace = appName + "/";
}

export const teamStateStorageKey = () => namespace + LOCAL_STORAGE_TEAMSTATE;
// Not the session — that is an HttpOnly cookie no script can read (issue #89).
// Only a flag that changes on login and logout, so another tab's `storage`
// event tells it to look again.
export const loginMarkerStorageKey = () => namespace + "loggedIn";
export const bgioStoragePrefix = () => namespace + BGIO_LOCALSTORAGE_PREFIX;
export const relayPointsStorageKey = () => namespace + "RelayPoints";
export const strategyPointsStorageKey = () => namespace + "StrategyPoints";
