// cspell:ignore aegnjrlearnjla Zrzcvp
// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { setLocalStorageNamespace, teamStateStorageKey, loginMarkerStorageKey, legacyGuidStorageKey, bgioStoragePrefix, relayPointsStorageKey, strategyPointsStorageKey } from "./storage-keys";
import { UserModel } from "../hooks/user-model";
import type { ClientRepository } from "../api-repository-interface";

// Logout only asks the repository to end its session; the keys are the
// subject here.
const repo = { logout: () => Promise.resolve() } as unknown as ClientRepository;

// The namespace is module state, so order matters within this file: the
// default-key expectations run before setLocalStorageNamespace. Other suites
// are unaffected — vitest gives each test file its own module registry.
describe("storage keys", () => {
  test("the default keys are the historical ones", () => {
    expect(teamStateStorageKey()).toStrictEqual("aegnjrlearnjla");
    expect(loginMarkerStorageKey()).toStrictEqual("loggedIn");
    expect(legacyGuidStorageKey()).toStrictEqual("kjqAEKeFkMpOvOZrzcvp");
    expect(bgioStoragePrefix()).toStrictEqual("bgio_");
    expect(relayPointsStorageKey()).toStrictEqual("RelayPoints");
    expect(strategyPointsStorageKey()).toStrictEqual("StrategyPoints");
  });

  // Regression: the apps at gyakorlo.durerinfo.hu shared every key, so a login
  // in one leaked into the other and logout wiped the other app's saved
  // matches too.
  test("a namespaced app's logout leaves another app's keys alone", async () => {
    setLocalStorageNamespace("relay-practise");

    localStorage.setItem("aegnjrlearnjla", "other app's team state");
    localStorage.setItem("loggedIn", "other app's login");
    localStorage.setItem("kjqAEKeFkMpOvOZrzcvp", "other app's old guid");
    localStorage.setItem("bgio_relay_state", "other app's saved match");
    localStorage.setItem("RelayPoints", "other app's relay score");
    localStorage.setItem("StrategyPoints", "other app's strategy score");
    localStorage.setItem(teamStateStorageKey(), "own team state");
    localStorage.setItem(loginMarkerStorageKey(), "own login");
    localStorage.setItem(legacyGuidStorageKey(), "own old guid");
    localStorage.setItem(bgioStoragePrefix() + "relay_6_d_a_state", "own saved match");
    localStorage.setItem(relayPointsStorageKey(), "own relay score");
    localStorage.setItem(strategyPointsStorageKey(), "own strategy score");

    await new UserModel(repo).logout();

    expect(localStorage.getItem(teamStateStorageKey())).toBeNull();
    expect(localStorage.getItem(loginMarkerStorageKey())).toBeNull();
    expect(localStorage.getItem(legacyGuidStorageKey())).toBeNull();
    expect(localStorage.getItem(bgioStoragePrefix() + "relay_6_d_a_state")).toBeNull();
    expect(localStorage.getItem(relayPointsStorageKey())).toBeNull();
    expect(localStorage.getItem(strategyPointsStorageKey())).toBeNull();
    expect(localStorage.getItem("aegnjrlearnjla")).toStrictEqual("other app's team state");
    expect(localStorage.getItem("loggedIn")).toStrictEqual("other app's login");
    expect(localStorage.getItem("kjqAEKeFkMpOvOZrzcvp")).toStrictEqual("other app's old guid");
    expect(localStorage.getItem("bgio_relay_state")).toStrictEqual("other app's saved match");
    expect(localStorage.getItem("RelayPoints")).toStrictEqual("other app's relay score");
    expect(localStorage.getItem("StrategyPoints")).toStrictEqual("other app's strategy score");
  });

  // Regression: the removal loop incremented its index after removeItem, which
  // shifts the remaining keys down one slot — so of adjacent matching keys,
  // every other one survived logout (issue #382).
  test("logout removes every matching key, not every other one", async () => {
    localStorage.clear();

    const matchingKeys = ["relay_6_d_a_initial", "relay_6_d_a_state", "relay_6_d_a_metadata", "relay_6_d_a_log"]
      .map(suffix => bgioStoragePrefix() + suffix);
    matchingKeys.forEach(key => localStorage.setItem(key, "own saved match"));
    localStorage.setItem("bgio_relay_state", "other app's saved match");

    await new UserModel(repo).logout();

    matchingKeys.forEach(key => expect(localStorage.getItem(key)).toBeNull());
    expect(localStorage.getItem("bgio_relay_state")).toStrictEqual("other app's saved match");
  });
});
