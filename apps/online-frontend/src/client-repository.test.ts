import { afterEach, describe, expect, test, vi } from "vitest";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { RealClientRepository } from "./client-repository";

// Uninitialised, i18next's `t` answers with nothing at all, which would make
// the assertion below read `Error: undefined`; the app initialises it, a unit
// test has no reason to.
vi.mock("i18next", () => ({ default: { t: (key: string) => key } }));

// Every call the repository makes, with what it was given. `axios.create` is
// what the repository builds its client from, so this is the whole transport.
function fakeAxios(answer: (method: string, url: string) => Promise<unknown>) {
  const calls: { method: string, url: string, body?: unknown }[] = [];
  const instance = {
    get: (url: string) => { calls.push({ method: "get", url }); return answer("get", url); },
    post: (url: string, body?: unknown) => { calls.push({ method: "post", url, body }); return answer("post", url); },
    delete: (url: string) => { calls.push({ method: "delete", url }); return answer("delete", url); },
  } as unknown as AxiosInstance;
  vi.spyOn(axios, "create").mockReturnValue(instance);
  return calls;
}

const ok = () => Promise.resolve({ data: {} });

const status = (code: number, data?: unknown) =>
  Promise.reject(new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, { status: code, data } as AxiosResponse));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the team routes", () => {
  // The join code is the team's login secret: a path segment lands in access
  // logs, browser history and the Referer header (issue #89).
  test("the join code travels in the body, never in the URL", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().joinWithCode("000-0000-000");

    expect(calls).toStrictEqual([{ method: "post", url: "team/join", body: { code: "000-0000-000" } }]);
  });

  test("an unknown join code is reported as such", async () => {
    fakeAxios(() => status(404));

    await expect(new RealClientRepository().joinWithCode("999-9999-999")).rejects.toThrow("Nem létező kód");
  });

  // The message is a translation key, not a Hungarian string: what this pins
  // is that a 429 picks that key, and `npm run i18n:check` that hu and en both
  // carry it. i18next answers with the key itself here, uninitialised.
  test("a client over the guessing limit is told to wait", async () => {
    fakeAxios(() => status(429));

    await expect(new RealClientRepository().joinWithCode("999-9999-999"))
      .rejects.toThrow("login.error.tooManyAttempts");
  });

  // The session is the cookie, so the routes name no team; and starting a
  // match changes state, so it is a POST.
  test("starting a round is a POST naming no team", async () => {
    const calls = fakeAxios(ok);
    const repo = new RealClientRepository();

    await repo.startRelay();
    await repo.startStrategy();
    await repo.toHome();

    expect(calls.map(call => [call.method, call.url])).toStrictEqual([
      ["post", "team/me/relay/play"],
      ["post", "team/me/strategy/play"],
      ["post", "team/me/gohome"],
    ]);
  });

  // The server takes the logout as JSON only, so a form another site submits
  // cannot log the team out; a body, even an empty one, is what makes it JSON.
  test("logging out sends a JSON body", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().logout();

    expect(calls).toStrictEqual([{ method: "post", url: "team/me/logout", body: {} }]);
  });

  test("a browser with no session has no team", async () => {
    fakeAxios(() => status(401));

    expect(await new RealClientRepository().getTeamState()).toBeNull();
  });
});

describe("removing a team", () => {
  const teamId = "8eae8669-125c-42e5-8b49-89afbac31679";

  test("is a DELETE naming the team", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().removeTeam(teamId);

    expect(calls).toStrictEqual([{ method: "delete", url: `/team/admin/${teamId}/remove` }]);
  });

  // The server's 404 means the team is already gone — the admin page acted on
  // a stale list — and the message says that rather than quoting axios.
  test("a team the server no longer has is reported as such", async () => {
    fakeAxios(() => status(404));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().removeTeam(teamId)).rejects.toThrow("A csapat már nem létezik");
  });

  test("any other failure is reported like the other admin actions", async () => {
    fakeAxios(() => status(500));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().removeTeam(teamId)).rejects.toThrow("Váratlan hiba történt");
  });
});

describe("adding minutes to one match", () => {
  const matchID = "0EKBiMgbJ5A";

  test("is a POST naming the match and the minutes", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().addMinutes(matchID, 10);

    expect(calls).toStrictEqual([
      { method: "post", url: `/game/admin/${matchID}/addminutes/10`, body: undefined },
    ]);
  });

  // The route refuses two different things with a 501 — a match that has
  // finished, and an id the team has moved on from — so the status alone does
  // not say which, and the kind it sends beside it is what picks the line. The
  // branch tested `err.code`, which carries axios's own string rather than the
  // status, so it never fired and both read as an unexpected error (#507).
  //
  // The messages are translation keys, not Hungarian strings: the admin page
  // carries the language switcher, and `npm run i18n:check` is what pins that
  // hu and en both have them. i18next answers with the key itself here.
  test.each([
    ["an id the team has moved on from",
      { kind: "other-match-running", running: "0EKBiMgbJ5A" },
      "admin.addMinutes.otherMatchRunning"],
    ["a match that has finished",
      { kind: "no-match-running" },
      "admin.addMinutes.noMatchRunning"],
  ])("says which refusal a 501 was for %s", async (_case, refusal, key) => {
    fakeAxios(() => status(501, refusal));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().addMinutes(matchID, 10)).rejects.toThrow(key);
  });

  // A kind this build does not know — the server learning a new refusal ahead
  // of the page — is better as the generic line than as a missing key.
  test("falls back to the generic message for a refusal it does not know", async () => {
    fakeAxios(() => status(501, { kind: "moon-phase" }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().addMinutes(matchID, 10)).rejects.toThrow("Váratlan hiba történt");
  });

  test("any other failure is reported like the other admin actions", async () => {
    fakeAxios(() => status(500));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().addMinutes(matchID, 10)).rejects.toThrow("Váratlan hiba történt");
  });
});

describe("adding minutes to every running match", () => {
  // One request, where the page used to send one per team out of a list it
  // held. The body is what the walk is asked for, and the grant in it is what
  // makes sending it again safe, so a typo in either is worth a test rather
  // than a hand-walk.
  test("is one POST carrying the minutes and the grant", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().addMinutesToEveryone(10, "a1b2c3d4");

    expect(calls).toStrictEqual([
      { method: "post", url: "/game/admin/addminutes", body: { minutes: 10, grant: "a1b2c3d4" } },
    ]);
  });

  // The route sends nothing until every running match has been walked, so what
  // the browser waits on is the whole round. The ten seconds every other call
  // here takes aborted that mid-walk.
  test("waits far longer than the other calls do", async () => {
    fakeAxios(ok);

    await new RealClientRepository().addMinutesToEveryone(10, "a1b2c3d4");

    expect(vi.mocked(axios.create).mock.calls.at(-1)?.[0]).toMatchObject({ timeout: 300_000 });
  });
});

describe("the archive of deleted teams", () => {
  const deletedAt = "2026-09-07T10:00:00.123Z";

  test("is read, restored and refilled through the admin routes", async () => {
    const calls = fakeAxios(ok);
    const repo = new RealClientRepository();

    await repo.getDeleted();
    await repo.removeAllTeams();
    await repo.restoreTeam(7);
    await repo.restoreBatch(deletedAt);

    expect(calls).toStrictEqual([
      { method: "get", url: "/team/admin/deleted" },
      { method: "delete", url: "/team/admin/all" },
      { method: "post", url: "/team/admin/deleted/7/restore", body: undefined },
      { method: "post", url: "/team/admin/deleted/restore", body: { deletedAt } },
    ]);
  });

  // The body names the column a live team holds; the message carries it on,
  // so the organiser knows what to rename or delete first.
  test("a restore a live team blocks says what it clashes on", async () => {
    fakeAxios(() => status(409, "Teamname already exists."));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().restoreTeam(7))
      .rejects.toThrow("Ütközik egy élő csapattal: Teamname already exists.");
  });

  test("a restore of a row the archive no longer has is reported as such", async () => {
    fakeAxios(() => status(404));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().restoreTeam(7)).rejects.toThrow("A csapat már nincs az archívumban");
  });
});
