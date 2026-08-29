import { LOCAL_STORAGE_TEAMSTATE } from "../api-repository-interface";
import { BGIO_LOCALSTORAGE_PREFIX } from "./util";

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
export const guidStorageKey = () => namespace + "kjqAEKeFkMpOvOZrzcvp";
export const bgioStoragePrefix = () => namespace + BGIO_LOCALSTORAGE_PREFIX;
