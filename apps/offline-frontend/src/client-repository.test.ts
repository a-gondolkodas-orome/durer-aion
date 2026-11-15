// @vitest-environment jsdom
import { LOCAL_STORAGE_TEAMSTATE, lastActiveStorageKey, matchStorageKey, relayPointsStorageKey } from "common-frontend/core";
import type { RelayEndReport } from "game";

const { sendGameData } = vi.hoisted(() => ({ sendGameData: vi.fn() }));
vi.mock("./sendData", () => ({ sendGameData, sendDataLogin: vi.fn() }));

import { OfflineClientRepository, STORED_LOGIN_MAX_AGE_MS } from "./client-repository";
import { readStoredTeamState } from "./stored-team-state";
import { teamData } from "./teamData";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify({
    teamId: "1", joinCode: "abc", teamName: "Csapat", competition: { id: teamData[0].competitionId }, category: "C", credentials: "c", email: "e",
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

describe("viewStrategy", () => {
  const stored = (fields: object) => localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify({
    teamId: "1", joinCode: "abc", teamName: "Csapat", competition: { id: teamData[0].competitionId }, category: "C", credentials: "c", email: "e",
    pageState: "HOME", relayMatch: { state: "NOT STARTED" }, ...fields,
  }));
  const finished = { state: "FINISHED", startAt: "2026-10-10T10:00:00Z", endAt: "2026-10-10T10:30:00Z", matchID: "", score: 9 };

  test("takes the team back to its finished strategy match, which stays finished", async () => {
    stored({ strategyMatch: finished });
    await new OfflineClientRepository().viewStrategy();
    expect(readStoredTeamState()).toMatchObject({ pageState: "STRATEGY", strategyMatch: { state: "FINISHED", score: 9 } });
  });

  test("refuses a strategy match that has not ended", () => {
    stored({ strategyMatch: { state: "NOT STARTED" } });
    expect(() => new OfflineClientRepository().viewStrategy()).toThrow();
    expect(readStoredTeamState()?.pageState).toBe("HOME");
  });
});

// Teams rehearse on shared computers: a login left behind must not hand the
// team, and its match, to whoever sits down a day later.
describe("the stored login", () => {
  const NOW = new Date("2026-10-11T09:00:00Z").getTime();
  const HOUR_MS = 60 * 60 * 1000;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("expires with everything saved beside it a day after the app last found it", async () => {
    localStorage.setItem(lastActiveStorageKey(), String(NOW - STORED_LOGIN_MAX_AGE_MS - 1));
    localStorage.setItem(matchStorageKey("relay_c"), '{"G":{}}');
    localStorage.setItem(relayPointsStorageKey(), "12");

    expect(await new OfflineClientRepository().getTeamState()).toBeNull();

    expect(localStorage.getItem(LOCAL_STORAGE_TEAMSTATE)).toBeNull();
    expect(localStorage.getItem(matchStorageKey("relay_c"))).toBeNull();
    expect(localStorage.getItem(relayPointsStorageKey())).toBeNull();
    expect(localStorage.getItem(lastActiveStorageKey())).toBeNull();
  });

  // The day runs from the last look, not from the login: a team that logged
  // in the evening before is still playing the next morning.
  test("lasts as long as the app keeps finding it", async () => {
    localStorage.setItem(lastActiveStorageKey(), String(NOW - 23 * HOUR_MS));

    expect(await new OfflineClientRepository().getTeamState()).toMatchObject({ teamName: "Csapat" });

    expect(localStorage.getItem(lastActiveStorageKey())).toBe(String(NOW));
  });

  test("stored before the limit existed starts its day now", async () => {
    expect(await new OfflineClientRepository().getTeamState()).toMatchObject({ teamName: "Csapat" });

    expect(localStorage.getItem(lastActiveStorageKey())).toBe(String(NOW));
  });

  test("starts its day at the login", async () => {
    localStorage.clear();
    const repo = new OfflineClientRepository();

    await repo.joinWithCode(teamData[0].join_code);

    expect(localStorage.getItem(lastActiveStorageKey())).toBe(String(NOW));
  });
});
