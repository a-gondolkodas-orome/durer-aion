// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";

// The key helper comes from the package entry, which resolves to a `dist` the
// CI test job never builds — the same reason sendData.test.ts mocks its way off
// the workspace packages. A name of its own also pins that the handler reaches
// for the namespaced key rather than writing a bare one.
const {
  bgioStoragePrefix, localWithBots, relayPointsStorageKey, sendGameData, RelayWrapper, Client,
} = vi.hoisted(() => ({
  bgioStoragePrefix: () => "relay-practise/bgio_",
  localWithBots: vi.fn(),
  relayPointsStorageKey: () => "relay-practise/RelayPoints",
  sendGameData: vi.fn(),
  RelayWrapper: vi.fn(),
  Client: vi.fn(),
}));

vi.mock("common-frontend", () => ({ bgioStoragePrefix, localWithBots, relayPointsStorageKey }));
vi.mock("./sendData", () => ({ sendGameData }));
// The wiring test reads the callback the app hands the reducer; building a real
// boardgame.io client around it is not what is under test here.
vi.mock("game", () => ({ RelayWrapper }));
vi.mock("boardgame.io/react", () => ({ Client }));

import { handleGameReport } from "./game-report";

const RELAY_KEY = "relay-practise/RelayPoints";

describe("handleGameReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("persists the score an end report carries", () => {
    handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });

    expect(localStorage.getItem(RELAY_KEY)).toStrictEqual("17");
  });

  // toHome() is the relay-end uploader, because it also covers giving up
  // mid-match, when the reducer's onEnd never fires. Forwarding from here as
  // well would put two end files in the organisers' bucket for one run.
  test("does not upload an end report", () => {
    handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });

    expect(sendGameData).not.toHaveBeenCalled();
  });

  test("forwards a step report and stores nothing", () => {
    const step = { component: "relay", phase: "step", answer: 42, G: { currentProblem: 2 } } as const;
    handleGameReport(step);

    expect(sendGameData).toHaveBeenCalledWith(step);
    expect(localStorage.length).toStrictEqual(0);
  });

  test("forwards a start report, which carries no score", () => {
    const start = { component: "relay", phase: "start" } as const;
    handleGameReport(start);

    expect(sendGameData).toHaveBeenCalledWith(start);
    expect(localStorage.length).toStrictEqual(0);
  });
});

// The wrapper's report callback defaults to a no-op, so an app that stops
// passing one still builds, lints, typechecks and plays — and records 0 for
// every practice run. Nothing else pins that this app passes one.
describe("the relay client's report callback", () => {
  test("is the handler that persists the score", async () => {
    localStorage.clear();
    const { ClientRelayWithBot } = await import("./myclient");
    ClientRelayWithBot(...([
      { name: "relay" },
      () => null,
      () => [undefined, ""],
      null,
    ] as unknown as Parameters<typeof ClientRelayWithBot>));

    const report = RelayWrapper.mock.calls[0]?.[0] as unknown as typeof handleGameReport;
    expect(report, "the relay client built its game with no report callback").toBeTypeOf("function");
    report({ component: "relay", phase: "end", G: { points: 9 } });

    expect(localStorage.getItem(RELAY_KEY)).toStrictEqual("9");
  });
});
