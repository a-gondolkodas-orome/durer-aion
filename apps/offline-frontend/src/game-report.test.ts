// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";

// The key helpers come from the package entry, which resolves to a `dist` the
// CI test job never builds — the same reason sendData.test.ts mocks its way off
// the workspace packages. The names here are deliberately not the bare keys
// this app really stores under: what the helpers return is storage-keys.test.ts's
// business, and a name of its own pins which of the two each branch reaches for.
const {
  BGIO_LOCALSTORAGE_PREFIX, boardWrapper, relayPointsStorageKey, strategyPointsStorageKey,
  sendGameData, gameWrapper, RelayWrapper, Client,
} = vi.hoisted(() => ({
  BGIO_LOCALSTORAGE_PREFIX: "bgio_",
  boardWrapper: vi.fn(),
  relayPointsStorageKey: () => "the relay key",
  strategyPointsStorageKey: () => "the strategy key",
  sendGameData: vi.fn(),
  gameWrapper: vi.fn(),
  RelayWrapper: vi.fn(),
  Client: vi.fn(),
}));

vi.mock("common-frontend", () => ({ BGIO_LOCALSTORAGE_PREFIX, boardWrapper, relayPointsStorageKey, strategyPointsStorageKey }));
vi.mock("./sendData", () => ({ sendGameData }));
// The wiring tests read the callback the app hands each reducer; building a real
// boardgame.io client around it is not what is under test here.
vi.mock("game", () => ({ gameWrapper, RelayWrapper }));
vi.mock("boardgame.io/react", () => ({ Client }));

import { handleGameReport } from "./game-report";

describe("handleGameReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("persists the score of a strategy end report and forwards it", () => {
    const end = { component: "strategy", phase: "end", G: { points: 12 } } as const;
    handleGameReport(end, "bgio_stones_e");

    expect(localStorage.getItem("the strategy key")).toStrictEqual("12");
    expect(sendGameData).toHaveBeenCalledWith(end, "bgio_stones_e");
  });

  test("persists the score of a relay end report", () => {
    handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });

    expect(localStorage.getItem("the relay key")).toStrictEqual("17");
  });

  // toHome() is the relay-end uploader, because it also covers giving up
  // mid-match, when the reducer's onEnd never fires. Forwarding from here as
  // well would put two end files in the organisers' bucket for one run.
  test("does not upload a relay end report", () => {
    handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });

    expect(sendGameData).not.toHaveBeenCalled();
  });

  test("forwards a step report with the match's storage key and stores nothing", () => {
    const step = { component: "strategy", phase: "step", G: { points: 3 } } as const;
    handleGameReport(step, "bgio_stones_e");

    expect(sendGameData).toHaveBeenCalledWith(step, "bgio_stones_e");
    expect(localStorage.length).toStrictEqual(0);
  });

  test("forwards a start report, which carries no score", () => {
    const start = { component: "strategy", phase: "start" } as const;
    handleGameReport(start);

    expect(sendGameData).toHaveBeenCalledWith(start, undefined);
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
    const end = { component: "strategy", phase: "end", G: { points: 12 } } as const;
    report(end);

    expect(localStorage.getItem("the strategy key")).toStrictEqual("12");
    expect(sendGameData).toHaveBeenCalledWith(end, "bgio_stones_e");
  });

  test("the relay client persists the score", async () => {
    const { ClientRelayWithBot } = await import("./myclient");
    ClientRelayWithBot(...(stubArgs("relay_e") as unknown as Parameters<typeof ClientRelayWithBot>));

    const report = RelayWrapper.mock.calls[0]?.[0] as unknown as typeof handleGameReport;
    expect(report, "the relay client built its game with no report callback").toBeTypeOf("function");
    report({ component: "relay", phase: "end", G: { points: 9 } });

    expect(localStorage.getItem("the relay key")).toStrictEqual("9");
  });
});
