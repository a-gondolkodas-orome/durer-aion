// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from "vitest";
import { MockClientRepository } from "../api-repository-interface";
import { bgioStoragePrefix, guidStorageKey, relayPointsStorageKey } from "../utils/storage-keys";
import { UserModel } from "./user-model";

// The mock repository answers join code "2" with a team that is in the middle
// of a relay match.
const repo = new MockClientRepository();

describe("UserModel session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("a browser with no session has no team to show", async () => {
    const user = new UserModel(repo);

    expect(user.isUserLoggedIn()).toBe(false);
    expect(await user.getTeamState()).toBeNull();
  });

  test("logging in with a join code loads that team on the next look", async () => {
    const user = new UserModel(repo);

    await user.login("2");

    expect(user.isUserLoggedIn()).toBe(true);
    expect(await user.getTeamState()).toMatchObject({ pageState: "RELAY" });
  });

  // Two teams share a browser at a school, and the second must not walk into
  // the first one's match: logging out takes the saved boardgame.io state with
  // it, not only the login.
  test("logging out drops the session and the match saved next to it", async () => {
    const user = new UserModel(repo);
    await user.login("2");
    localStorage.setItem(`${bgioStoragePrefix()}relay_c`, '{"G":{}}');
    localStorage.setItem(relayPointsStorageKey(), "12");

    user.logout();

    expect(localStorage.getItem(guidStorageKey())).toBeNull();
    expect(localStorage.getItem(`${bgioStoragePrefix()}relay_c`)).toBeNull();
    expect(localStorage.getItem(relayPointsStorageKey())).toBeNull();
    expect(user.isUserLoggedIn()).toBe(false);
  });

  test("a logged-out browser cannot start a round", async () => {
    const startRelay = vi.spyOn(repo, "startRelay");
    const user = new UserModel(repo);

    await user.startRelay();

    expect(startRelay).not.toHaveBeenCalled();
    startRelay.mockRestore();
  });
});
