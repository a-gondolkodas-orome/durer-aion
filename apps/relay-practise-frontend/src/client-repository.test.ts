// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { relayPointsStorageKey } from "common-frontend/core";

vi.mock("./sendData", () => ({ sendGameData: vi.fn(), sendDataLogin: vi.fn() }));

import { OfflineClientRepository } from "./client-repository";
import { handleGameReport } from "./game-report";
import { teamData } from "./teamData";

let track: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  track = vi.fn();
  window.umami = { track: track as NonNullable<Window["umami"]>["track"] };
});

afterEach(() => {
  delete window.umami;
});

// handleGameReport counts a finish only for a round's first end report, read
// off whether a score is stored, so a round starts with none.
test("a round started over an earlier round's score counts its own finish", async () => {
  localStorage.setItem(relayPointsStorageKey(), "12");
  const repo = new OfflineClientRepository();
  await repo.joinWithCode(teamData[0].join_code);
  await repo.startRelay();

  handleGameReport({ component: "relay", phase: "end", G: { points: 5 } });

  expect(track).toHaveBeenCalledWith("relay-finished", expect.objectContaining({ points: 5 }));
});
