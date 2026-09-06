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
  } as unknown as AxiosInstance;
  vi.spyOn(axios, "create").mockReturnValue(instance);
  return calls;
}

const ok = () => Promise.resolve({ data: {} });

const status = (code: number) =>
  Promise.reject(new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, { status: code } as AxiosResponse));

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
