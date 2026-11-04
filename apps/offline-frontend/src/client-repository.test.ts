// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from "vitest";
import { LOCAL_STORAGE_TEAMSTATE } from "common-frontend/core";
import type { RelayEndReport } from "game";

const { sendGameData } = vi.hoisted(() => ({ sendGameData: vi.fn() }));
vi.mock("./sendData", () => ({ sendGameData, sendDataLogin: vi.fn() }));

import { OfflineClientRepository } from "./client-repository";
import { readStoredTeamState } from "./stored-team-state";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify({
    teamId: "1", joinCode: "abc", teamName: "Csapat", category: "C", credentials: "c", email: "e",
    pageState: "RELAY",
    relayMatch: { state: "IN PROGRESS", startAt: "2026-10-10T10:00:00Z", endAt: "2026-10-10T11:00:00Z", matchID: "" },
    strategyMatch: { state: "NOT STARTED" },
  }));
});

// Regression: a relay left to run out never ended, so no end report stored its
// score, and the team went home with 0 and no results table, and the organisers
// got an end file with 0 points.
test("a relay whose time ran out goes home with the score its board kept", async () => {
  const report = {
    component: "relay", phase: "end",
    G: { points: 5, start: "2026-10-10T10:00:00Z", maxPointsList: [3, 4], previousPoints: [3, 2], previousAnswers: [[], []] },
  } as unknown as RelayEndReport;
  const repo = new OfflineClientRepository();
  repo.keepRelayEnd(report);
  await repo.toHome();

  const relay = readStoredTeamState()?.relayMatch;
  expect(relay).toMatchObject({ state: "FINISHED", score: 5 });
  expect(relay && "relayResults" in relay && relay.relayResults).toHaveLength(2);
  expect(sendGameData).toHaveBeenCalledExactlyOnceWith({ component: "relay", phase: "end", G: { points: 5 } });
});
