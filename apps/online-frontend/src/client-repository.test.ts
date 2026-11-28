import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { I18nError } from "common-frontend/core";
import { RealClientRepository } from "./client-repository";

// Every call the repository makes, with what it was given. `axios.create` is
// what the repository builds its client from, so this is the whole transport.
function fakeAxios(answer: (method: string, url: string) => Promise<unknown>) {
  const calls: { method: string, url: string, body?: unknown }[] = [];
  const instance = {
    get: (url: string) => { calls.push({ method: "get", url }); return answer("get", url); },
    post: (url: string, body?: unknown) => { calls.push({ method: "post", url, body }); return answer("post", url); },
    delete: (url: string) => { calls.push({ method: "delete", url }); return answer("delete", url); },
    put: (url: string, body?: unknown) => { calls.push({ method: "put", url, body }); return answer("put", url); },
  } as unknown as AxiosInstance;
  vi.spyOn(axios, "create").mockReturnValue(instance);
  return calls;
}

const ok = () => Promise.resolve({ data: {} });

const status = (code: number, data?: unknown) =>
  Promise.reject(new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, { status: code, data } as AxiosResponse));

/** The server refusing, with the code it says why with. */
const refused = (httpStatus: number, code: string) => status(httpStatus, { code, message: "In English." });

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

  // A message is a translation key, not a Hungarian string: what these pin is
  // which key a code picks, and `npm run i18n:check` that hu and en carry it.
  test("an unknown join code is reported as such", async () => {
    fakeAxios(() => refused(404, "UNKNOWN_JOIN_CODE"));

    await expect(new RealClientRepository().joinWithCode("999-9999-999"))
      .rejects.toMatchObject({ i18nKey: "login.error.wrongid", code: "UNKNOWN_JOIN_CODE" });
  });

  test("a client over the guessing limit is told to wait", async () => {
    fakeAxios(() => refused(429, "TOO_MANY_ATTEMPTS"));

    await expect(new RealClientRepository().joinWithCode("999-9999-999"))
      .rejects.toMatchObject({ i18nKey: "login.error.tooManyAttempts" });
  });

  // Why a start was refused is something the team can act on: wait, or stop.
  test("a start outside the start window says which side of it", async () => {
    fakeAxios(() => refused(403, "COMPETITION_NOT_STARTED"));

    await expect(new RealClientRepository().startRelay())
      .rejects.toMatchObject({ i18nKey: "error.competitionNotStarted" });
  });

  // The session is the cookie, so the routes name no team; and starting a
  // match changes state, so it is a POST.
  test("starting a round is a POST naming no team", async () => {
    const calls = fakeAxios(ok);
    const repo = new RealClientRepository();

    await repo.startRelay();
    await repo.startStrategy();
    await repo.toHome();
    await repo.viewStrategy();

    expect(calls.map(call => [call.method, call.url])).toStrictEqual([
      ["post", "team/me/relay/play"],
      ["post", "team/me/strategy/play"],
      ["post", "team/me/gohome"],
      ["post", "team/me/strategy/view"],
    ]);
  });

  // The server takes the logout as JSON only, so a form another site submits
  // cannot log the team out; a body, even an empty one, is what makes it JSON.
  test("logging out sends a JSON body", async () => {
    const calls = fakeAxios(ok);

    await new RealClientRepository().logout();

    expect(calls).toStrictEqual([{ method: "post", url: "team/me/logout", body: {} }]);
  });

  // A school computer's clock can be off by hours; the page reads the start
  // window by the server's.
  test("the team's state carries how far the server's clock is from the browser's", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T12:00:00Z") });
    fakeAxios(() => Promise.resolve({ data: {
      relayMatch: { state: "NOT STARTED" }, strategyMatch: { state: "NOT STARTED" },
      serverTime: "2026-10-20T13:00:00.000Z",
    } }));

    const state = await new RealClientRepository().getTeamState();

    vi.useRealTimers();
    expect(state?.clockOffsetMs).toBe(3600_000);
  });

  // A school network's first request shares the line with the page's own
  // JavaScript, and a timed-out `team/me` stays on screen until a reload (#715).
  test.each([
    ["reading the team's state", (repo: RealClientRepository) => repo.getTeamState()],
    ["joining with a code", (repo: RealClientRepository) => repo.joinWithCode("000-0000-000")],
  ])("%s waits longer than the default", async (_, send) => {
    fakeAxios(() => Promise.resolve({ data: { relayMatch: { state: "NOT STARTED" }, strategyMatch: { state: "NOT STARTED" } } }));

    await send(new RealClientRepository());

    const created = vi.mocked(axios.create).mock.calls.at(-1)?.[0];
    expect(created?.timeout).toBeGreaterThanOrEqual(30_000);
    expect(created?.timeout).toBeLessThan(60_000);
  });

  test("a browser with no session has no team", async () => {
    fakeAxios(() => refused(401, "NOT_LOGGED_IN"));

    expect(await new RealClientRepository().getTeamState()).toBeNull();
  });

  test("any other failure to read the state is reported, not taken for a logout", async () => {
    fakeAxios(() => status(502));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().getTeamState()).rejects.toBeInstanceOf(I18nError);
  });
});

describe("a failed request", () => {
  test("a code this client does not know is an unexpected error", async () => {
    fakeAxios(() => refused(403, "SOMETHING_NEW"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().toHome()).rejects.toMatchObject({ i18nKey: "error.unexpected" });
    expect(logged).toHaveBeenCalled();
  });

  test("a server error is an unexpected error", async () => {
    fakeAxios(() => status(500));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new RealClientRepository().addMinutes("match-1", 5))
      .rejects.toMatchObject({ i18nKey: "error.unexpected" });
  });

  test("no answer at all is a lost connection", async () => {
    fakeAxios(() => Promise.reject(new AxiosError("Network Error", "ERR_NETWORK")));

    await expect(new RealClientRepository().getAll()).rejects.toMatchObject({ i18nKey: "error.noConnection" });
  });
});

describe("adding minutes to a match", () => {
  test("a match that is over is reported as such", async () => {
    fakeAxios(() => refused(409, "MATCH_FINISHED"));

    await expect(new RealClientRepository().addMinutes("match-1", 5))
      .rejects.toMatchObject({ i18nKey: "error.matchFinished" });
  });
});

describe("the team import", () => {
  test("uploads the file as the route's one `file` field", async () => {
    const calls = fakeAxios(ok);
    const file = new File(["Teamname\n"], "teams.tsv");

    await new RealClientRepository().importTeams(file);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "put", url: "/team/admin/import" });
    expect((calls[0].body as FormData).get("file")).toBe(file);
  });

  // The answer is the only copy of the generated join codes, and nginx gives
  // the backend 60 seconds (its default proxy_read_timeout): a client that gave
  // up first would drop codes for teams that went in regardless.
  test("waits longer than nginx does", async () => {
    fakeAxios(ok);

    await new RealClientRepository().importTeams(new File([""], "teams.tsv"));

    const created = vi.mocked(axios.create).mock.calls.at(-1)?.[0];
    expect(created?.timeout).toBeGreaterThan(60_000);
  });

  test("a file the route refuses for its name is said to need .tsv", async () => {
    fakeAxios(() => refused(400, "IMPORT_NOT_TSV"));

    await expect(new RealClientRepository().importTeams(new File([""], "teams.csv")))
      .rejects.toMatchObject({ i18nKey: "error.importNotTsv" });
  });

  // nginx refuses an upload over its limit before the backend sees it.
  test("a file too large for the proxy is said to be too large", async () => {
    fakeAxios(() => status(413, "<html>Request Entity Too Large</html>"));

    await expect(new RealClientRepository().importTeams(new File([""], "teams.tsv")))
      .rejects.toMatchObject({ i18nKey: "error.fileTooLarge" });
  });

  test("an import that outlasts the timeout says some teams may be in", async () => {
    fakeAxios(() => Promise.reject(new AxiosError("timeout", "ECONNABORTED")));

    await expect(new RealClientRepository().importTeams(new File([""], "teams.tsv")))
      .rejects.toMatchObject({ i18nKey: "error.importTimedOut" });
  });
});

describe("the admin routes", () => {
  test("a competition bundle is a POST of the bundle as JSON", async () => {
    const calls = fakeAxios(ok);
    const bundle = { format: "durer-competitions", version: 1, competitions: {}, problems: {} };

    await new RealClientRepository().importCompetitions(bundle);

    expect(calls).toStrictEqual([{ method: "post", url: "/team/admin/competitions/import", body: bundle }]);
  });

  test("a competition export is a GET", async () => {
    const calls = fakeAxios(() => Promise.resolve({ status: 200, data: { format: "durer-competitions" } }));

    expect(await new RealClientRepository().exportCompetitions()).toStrictEqual({ format: "durer-competitions" });

    expect(calls).toStrictEqual([{ method: "get", url: "/team/admin/competitions/export" }]);
  });

  test("a competition's own page is a GET by its id", async () => {
    const calls = fakeAxios(() => Promise.resolve({ status: 200, data: { id: "aqvco71pta--csomag-teljes" } }));

    expect(await new RealClientRepository().getCompetition("aqvco71pta--csomag-teljes"))
      .toStrictEqual({ id: "aqvco71pta--csomag-teljes" });

    expect(calls).toStrictEqual([{ method: "get", url: "/team/admin/competitions/aqvco71pta--csomag-teljes" }]);
  });

  test("a problem's editor reads it by its id, and saves it, or dry-runs the save, as a PUT of { problem }", async () => {
    const calls = fakeAxios(() => Promise.resolve({ status: 200, data: { written: false } }));
    const problem = { id: "10iqp4vy6b--csomag-kockak", answer: 27, content: { hu: { problemText: "Hány?" } } };

    await new RealClientRepository().getProblem(problem.id);
    await new RealClientRepository().saveProblem(problem, { dryRun: true });
    await new RealClientRepository().saveProblem(problem, { dryRun: false });

    expect(calls).toStrictEqual([
      { method: "get", url: "/team/admin/problems/10iqp4vy6b--csomag-kockak" },
      { method: "put", url: "/team/admin/problems/10iqp4vy6b--csomag-kockak?dryRun=1", body: { problem } },
      { method: "put", url: "/team/admin/problems/10iqp4vy6b--csomag-kockak", body: { problem } },
    ]);
  });

  test("a team's own start window is a PUT of the window as JSON", async () => {
    const calls = fakeAxios(ok);
    const window = { opensAt: "2026-11-21T15:00+01:00", closesAt: null };

    await new RealClientRepository().setStartWindow("8eae8669-125c-42e5-8b49-89afbac31679", window);

    expect(calls).toStrictEqual([
      { method: "put", url: "/team/admin/8eae8669-125c-42e5-8b49-89afbac31679/start-window", body: window },
    ]);
  });
});
