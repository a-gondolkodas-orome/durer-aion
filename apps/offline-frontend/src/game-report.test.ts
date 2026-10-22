// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";

import { matchStorageKey, relayPointsStorageKey, relayResultsStorageKey, strategyPointsStorageKey, strategyResultsStorageKey } from "common-frontend/core";

// myclient.ts takes boardWrapper from the full package entry. Loading it for
// real brings in MUI, the data grid and the i18next setup for a board this
// suite never renders, and takes the wiring tests past vitest's 5 s timeout.
const { boardWrapper, sendGameData, gameWrapper, RelayWrapper, Client } = vi.hoisted(() => ({
  boardWrapper: vi.fn(),
  sendGameData: vi.fn(),
  gameWrapper: vi.fn(),
  RelayWrapper: vi.fn(),
  Client: vi.fn(),
}));

vi.mock("common-frontend", () => ({ boardWrapper }));
vi.mock("./sendData", () => ({ sendGameData }));
// The wiring tests read the callback the app hands each reducer; building a real
// boardgame.io client around it is not what is under test here.
vi.mock("game", async (importOriginal) => ({ ...await importOriginal<typeof import("game")>(), gameWrapper, RelayWrapper }));
vi.mock("boardgame.io/react", () => ({ Client }));

import { handleGameReport } from "./game-report";
import type { RelayReport, StrategyReport } from "game";

// Reports as the reducers send them, with just the fields a test is about.
const relayEnd = (G: object) => ({
  component: "relay", phase: "end", G: { maxPointsList: [], previousPoints: [], previousAnswers: [], ...G },
}) as unknown as RelayReport;
const strategyReport = (phase: "step" | "end", G: object) => ({
  component: "strategy", phase, G: { liveResults: [], ...G },
}) as unknown as StrategyReport<unknown>;

describe("handleGameReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("persists the score of a strategy end report and forwards it", () => {
    const end = strategyReport("end", { points: 12 });
    handleGameReport(end, "bgio_stones_e");

    expect(localStorage.getItem(strategyPointsStorageKey())).toStrictEqual("12");
    expect(sendGameData).toHaveBeenCalledWith(end, "bgio_stones_e");
  });

  test("persists the live games of a strategy end report for the home page", () => {
    handleGameReport(strategyReport("end", { points: 9, liveResults: ["lost", "won", "won"] }));

    expect(localStorage.getItem(strategyResultsStorageKey())).toStrictEqual('["lost","won","won"]');
  });

  test("persists the problems of a relay end report for the home page", () => {
    const tries = [{ answer: 1, date: "2026-10-10T10:01:00Z" }, { answer: 2, date: "2026-10-10T10:01:30Z" }];
    handleGameReport(relayEnd({
      points: 2, start: "2026-10-10T10:00:00Z", maxPointsList: [3, 4], previousPoints: [2], previousAnswers: [tries, []],
    }));

    expect(JSON.parse(localStorage.getItem(relayResultsStorageKey()) ?? "")).toStrictEqual([
      { maxPoints: 3, points: 2, trySeconds: [60, 30] },
      { maxPoints: 4, points: 0, trySeconds: [] },
    ]);
  });

  test("persists the score of a relay end report", () => {
    handleGameReport(relayEnd({ points: 17 }));

    expect(localStorage.getItem(relayPointsStorageKey())).toStrictEqual("17");
  });

  // toHome() is the relay-end uploader, because it also covers giving up
  // mid-match, when the reducer's onEnd never fires. Forwarding from here as
  // well would put two end files in the organisers' bucket for one run.
  test("does not upload a relay end report", () => {
    handleGameReport(relayEnd({ points: 17 }));

    expect(sendGameData).not.toHaveBeenCalled();
  });

  test("forwards a step report with the match's storage key and stores nothing", () => {
    const step = strategyReport("step", { points: 3 });
    handleGameReport(step, "bgio_stones_e");

    expect(sendGameData).toHaveBeenCalledWith(step, "bgio_stones_e");
    expect(localStorage.length).toStrictEqual(0);
  });
});

// Both wrappers default their report callback to a no-op, so an app that stops
// passing one still builds, lints, typechecks and plays — and records 0 for
// every team in the dry run. Nothing else pins that this app passes one.
describe("the clients' report callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const stubArgs = (name: string) => [
    { name },
    () => null,
    () => [undefined, ""],
    null,
  ];

  test("the strategy client persists the score, and names the match's log", async () => {
    const { ClientWithBot } = await import("./myclient");
    ClientWithBot(...(stubArgs("stones_e") as unknown as Parameters<typeof ClientWithBot>));

    const report = gameWrapper.mock.calls[0]?.[1] as unknown as typeof handleGameReport;
    expect(report, "the strategy client built its game with no report callback").toBeTypeOf("function");
    const end = strategyReport("end", { points: 12 });
    report(end);

    expect(localStorage.getItem(strategyPointsStorageKey())).toStrictEqual("12");
    expect(sendGameData).toHaveBeenCalledWith(end, matchStorageKey("stones_e"));
  });

  test("the relay client persists the score", async () => {
    const { ClientRelayWithBot } = await import("./myclient");
    ClientRelayWithBot(...(["relay_e", ...stubArgs("relay_e").slice(1)] as unknown as Parameters<typeof ClientRelayWithBot>));

    const report = RelayWrapper.mock.calls[0]?.[0] as unknown as typeof handleGameReport;
    expect(report, "the relay client built its game with no report callback").toBeTypeOf("function");
    report(relayEnd({ points: 9 }));

    expect(localStorage.getItem(relayPointsStorageKey())).toStrictEqual("9");
  });
});
