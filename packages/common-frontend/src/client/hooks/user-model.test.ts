// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { MockClientRepository } from "../api-repository-interface";
import { bgioStoragePrefix, legacyGuidStorageKey, loginMarkerStorageKey, relayPointsStorageKey } from "../utils/storage-keys";
import { UserModel } from "./user-model";

// The mock repository answers join code "2" with a team that is in the middle
// of a relay match. The session lives in the repository — online it is an
// HttpOnly cookie — so every test gets a fresh one.
let repo: MockClientRepository;

describe("UserModel session", () => {
  beforeEach(() => {
    localStorage.clear();
    repo = new MockClientRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("a browser with no session has no team to show", async () => {
    const user = new UserModel(repo);

    expect(await user.getTeamState()).toBeNull();
  });

  // Regression: the GUID used to live in localStorage (issue #89), and a
  // browser that logged in before the cookie kept it there indefinitely, since
  // nothing wrote or read the key any more.
  test("a browser that logged in before the cookie is relieved of its GUID", async () => {
    localStorage.setItem(legacyGuidStorageKey(), "8eae8669-125c-42e5-8b49-89afbac31679");
    const user = new UserModel(repo);

    await user.getTeamState();

    expect(localStorage.getItem(legacyGuidStorageKey())).toBeNull();
  });

  // Regression: the marker is a constant, and writing a value a key already
  // holds fires no `storage` event — so a marker outliving its session (the
  // cookie expired, or the teams were re-imported) hid the next login from
  // the other tabs.
  test("finding no session clears the marker, so the next login is heard", async () => {
    localStorage.setItem(loginMarkerStorageKey(), "1");
    const user = new UserModel(repo);

    expect(await user.getTeamState()).toBeNull();

    expect(localStorage.getItem(loginMarkerStorageKey())).toBeNull();
  });

  test("logging in with a join code loads that team on the next look", async () => {
    const user = new UserModel(repo);

    await user.login("2");

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
    const endSession = vi.spyOn(repo, "logout");

    await user.logout();

    expect(endSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(loginMarkerStorageKey())).toBeNull();
    expect(localStorage.getItem(`${bgioStoragePrefix()}relay_c`)).toBeNull();
    expect(localStorage.getItem(relayPointsStorageKey())).toBeNull();
    expect(await user.getTeamState()).toBeNull();
  });

  // Nothing client-side knows whether there is a session, so the refusal is
  // the server's (a 401); the page reloads to show the login form.
  test("a logged-out browser cannot start a round", async () => {
    const startRelay = vi.spyOn(repo, "startRelay");
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const user = new UserModel(repo);

    await user.startRelay();

    expect(startRelay.mock.results[0].type).toBe("throw");
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
