// @vitest-environment jsdom
import type { LogEntry } from "boardgame.io";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// The join code names every uploaded file; where it is stored is
// stored-team-state's business, and mocking it keeps this suite off the
// workspace packages' unbuilt `dist`.
vi.mock("./stored-team-state", () => ({
  readStoredTeamState: () => ({ joinCode: "ABC123" }),
}));

import { sendGameData } from "./sendData";

const STORAGE_KEY = "bgio_stones_e";

const entry = {
  action: { type: "MAKE_MOVE", payload: { type: "takeStone", args: [true], playerID: "0" } },
  _stateID: 4,
  turn: 5,
  phase: "play",
} as unknown as LogEntry;

// Never resolves: sendData logs the response status, and a test run keeps its
// output to the report (vitest.setup.mts). What it sent is what matters here.
const fetchMock = vi.fn(
  (_input: RequestInfo | URL, _init?: RequestInit) => new Promise<Response>(() => undefined)
);

// The uploader appends strings; anything else here means the payload changed
// shape, which is worth a failure rather than a stringified `[object File]`.
function textField(body: FormData, name: string): string {
  const value = body.get(name);
  if (typeof value !== "string") {
    throw new Error(`the uploaded form's ${name} is not text`);
  }
  return value;
}

function uploaded() {
  return fetchMock.mock.calls.map(([, init]) => {
    const body = init?.body;
    if (!(body instanceof FormData)) {
      throw new Error("the upload sent no form");
    }
    return { key: textField(body, "key"), file: textField(body, "file") };
  });
}

describe("sendGameData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_S3_BUCKET_NAME", "https://bucket.example");
    vi.stubEnv("VITE_S3_FOLDER", "folder");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY + "_log", JSON.stringify([["default", [entry]]]));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // Issue #322: the wrapper handed its move context's `log` straight to the
  // payload, and that is boardgame.io's log *plugin* — an object of functions,
  // which `JSON.stringify` writes as `{}`. Every step of every dry run reported
  // an empty log, where the live round's admin dump serves real entries.
  test("reports the match log boardgame.io persisted, not an empty object", () => {
    sendGameData({ component: "strategy", phase: "step", G: { points: 3 }, ctx: undefined }, STORAGE_KEY);
    vi.runAllTimers();

    const [file] = uploaded();
    expect(JSON.parse(file.file)).toStrictEqual({ G: { points: 3 }, log: [entry] });
  });

  // The entries for the step being reported are written by the local master
  // after the reducer returns, so a file sent from inside it would be a step
  // behind — and its `G` is a revoked immer draft by the time the log is there.
  test("waits for the step's own entries before uploading", () => {
    sendGameData({ component: "strategy", phase: "step", G: { points: 3 } }, STORAGE_KEY);
    expect(fetchMock).not.toHaveBeenCalled();

    localStorage.setItem(STORAGE_KEY + "_log", JSON.stringify([["default", [entry, entry]]]));
    vi.runAllTimers();

    expect(JSON.parse(uploaded()[0].file).log).toStrictEqual([entry, entry]);
  });

  // A file that claims `"log": {}` reads as a match nobody moved in. Saying
  // nothing is the honest answer when there is no log to read.
  test("claims no log when the caller names no match storage", () => {
    sendGameData({ component: "strategy", phase: "step", G: { points: 3 } });
    vi.runAllTimers();

    expect(JSON.parse(uploaded()[0].file)).not.toHaveProperty("log");
  });

  test("names the step file after the team and the game", () => {
    sendGameData({ component: "strategy", phase: "step", G: { points: 3 } }, STORAGE_KEY);
    vi.runAllTimers();

    expect(uploaded()[0].key).toMatch(/^folder\/ABC123_\d{6}_stratstep_\d{8}T\d{6}\d*$/);
  });

  // The relay files are unchanged by all this: its answers go up as they are
  // judged, with no log of their own.
  test("uploads a relay step as it is reported", () => {
    sendGameData({ component: "relay", phase: "step", answer: 42, G: { currentProblem: 2 } }, STORAGE_KEY);

    expect(JSON.parse(uploaded()[0].file)).toStrictEqual({ G: { currentProblem: 2 } });
  });
});
