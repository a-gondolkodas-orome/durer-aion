// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { setLocalStorageNamespace, teamStateStorageKey, guidStorageKey, bgioStoragePrefix } from "./storage-keys";
import { UserModel } from "../hooks/user-model";
import type { ClientRepository } from "../api-repository-interface";

// The namespace is module state, so order matters within this file: the
// default-key expectations run before setLocalStorageNamespace. Other suites
// are unaffected — vitest gives each test file its own module registry.
describe("storage keys", () => {
  test("the default keys are the historical ones", () => {
    expect(teamStateStorageKey()).toStrictEqual("aegnjrlearnjla");
    expect(guidStorageKey()).toStrictEqual("kjqAEKeFkMpOvOZrzcvp");
    expect(bgioStoragePrefix()).toStrictEqual("bgio_");
  });

  // Regression: the apps at gyakorlo.durerinfo.hu shared every key, so a login
  // in one leaked into the other and logout wiped the other app's saved
  // matches too.
  test("a namespaced app's logout leaves another app's keys alone", () => {
    setLocalStorageNamespace("relay-practise");

    localStorage.setItem("aegnjrlearnjla", "other app's team state");
    localStorage.setItem("kjqAEKeFkMpOvOZrzcvp", "other app's guid");
    localStorage.setItem("bgio_relay_state", "other app's saved match");
    localStorage.setItem(teamStateStorageKey(), "own team state");
    localStorage.setItem(guidStorageKey(), "own guid");
    localStorage.setItem(bgioStoragePrefix() + "relay_6_d_a_state", "own saved match");

    new UserModel({} as ClientRepository).logout();

    expect(localStorage.getItem(teamStateStorageKey())).toBeNull();
    expect(localStorage.getItem(guidStorageKey())).toBeNull();
    expect(localStorage.getItem(bgioStoragePrefix() + "relay_6_d_a_state")).toBeNull();
    expect(localStorage.getItem("aegnjrlearnjla")).toStrictEqual("other app's team state");
    expect(localStorage.getItem("kjqAEKeFkMpOvOZrzcvp")).toStrictEqual("other app's guid");
    expect(localStorage.getItem("bgio_relay_state")).toStrictEqual("other app's saved match");
  });

  // Regression: the removal loop incremented its index after removeItem, which
  // shifts the remaining keys down one slot — so of adjacent matching keys,
  // every other one survived logout (issue #382).
  test("logout removes every matching key, not every other one", () => {
    localStorage.clear();

    const matchingKeys = ["relay_6_d_a_initial", "relay_6_d_a_state", "relay_6_d_a_metadata", "relay_6_d_a_log"]
      .map(suffix => bgioStoragePrefix() + suffix);
    matchingKeys.forEach(key => localStorage.setItem(key, "own saved match"));
    localStorage.setItem("bgio_relay_state", "other app's saved match");

    new UserModel({} as ClientRepository).logout();

    matchingKeys.forEach(key => expect(localStorage.getItem(key)).toBeNull());
    expect(localStorage.getItem("bgio_relay_state")).toStrictEqual("other app's saved match");
  });
});
