// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { setLocalStorageNamespace } from "common-frontend/core";

const { readStoredTeamState, RelayWrapper, Client } = vi.hoisted(() => ({
  readStoredTeamState: vi.fn(),
  RelayWrapper: vi.fn(),
  Client: vi.fn(),
}));

vi.mock("./stored-team-state", () => ({ readStoredTeamState }));
// The wiring test reads the callback the app hands the reducer; building a real
// boardgame.io client around it is not what is under test here.
vi.mock("game", () => ({ RelayWrapper }));
vi.mock("boardgame.io/react", () => ({ Client }));

import { handleGameReport } from "./game-report";

// As index.tsx sets it: the namespaced key, spelled out, pins that the handler
// reaches for it rather than writing a bare one.
setLocalStorageNamespace("relay-practise");
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

  describe("the umami finish event", () => {
    let track: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      track = vi.fn();
      window.umami = { track: track as NonNullable<Window["umami"]>["track"] };
    });

    afterEach(() => {
      delete window.umami;
    });

    test("names the round by its parts, with the score", () => {
      readStoredTeamState.mockReturnValue({ teamName: "12_D_C+" });
      handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });

      expect(track).toHaveBeenCalledExactlyOnceWith("relay-finished", { year: "12", round: "final", category: "C+", points: 17 });
    });

    // A round can report its end more than once (see
    // ClientRepository.keepRelayEnd); the later score is the one kept.
    test("is sent once for a round that reports its end twice, which keeps the later score", () => {
      readStoredTeamState.mockReturnValue({ teamName: "12_D_C+" });
      handleGameReport({ component: "relay", phase: "end", G: { points: 17 } });
      handleGameReport({ component: "relay", phase: "end", G: { points: 20 } });

      expect(track).toHaveBeenCalledOnce();
      expect(localStorage.getItem(RELAY_KEY)).toStrictEqual("20");
    });

    test("is not sent for a step report", () => {
      readStoredTeamState.mockReturnValue({ teamName: "12_D_C+" });
      handleGameReport({ component: "relay", phase: "step", G: { points: 3 } });

      expect(track).not.toHaveBeenCalled();
    });
  });

  test("stores nothing for a step report", () => {
    handleGameReport({ component: "relay", phase: "step", G: { points: 3 } });

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
      "relay",
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
