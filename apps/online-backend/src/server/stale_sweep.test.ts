import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StorageAPI } from "boardgame.io";
import type { MatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { STALE_SWEEP_INTERVAL_MS, startStaleSweep, sweepStaleMatches } from "./stale_sweep";

const RAN_OUT = new Date("2026-03-21T11:00:00Z");
const STILL_RUNNING = new Date("2099-01-01T00:00:00Z");
const NOW = new Date("2026-03-21T12:00:00Z");

const running = (matchID: string, endAt: Date): MatchStatus =>
  ({ state: "IN PROGRESS", matchID, startAt: new Date("2026-03-21T10:00:00Z"), endAt });

/** Only the fields the sweep and `closeMatch` read. */
const team = (teamId: string, fields: Partial<TeamModel> = {}) =>
  ({
    teamId,
    relayMatch: { state: "NOT STARTED" },
    strategyMatch: { state: "NOT STARTED" },
    update: vi.fn().mockResolvedValue(undefined),
    ...fields,
  }) as unknown as TeamModel;

/** A repository serving these rows, and finding a team by the id it was given. */
const repositoryOf = (rows: TeamModel[]) =>
  ({
    listTeams: vi.fn().mockResolvedValue(rows),
    getTeam: vi.fn().mockImplementation(({ teamId }: { teamId: string }) =>
      Promise.resolve(rows.find(row => row.teamId === teamId) ?? null)),
  }) as unknown as TeamsRepository;

/** Storage answering for any match: the team that owns it, and its score. */
const storageOf = (points: number, gameName = "relay_c") =>
  ({
    fetch: vi.fn().mockImplementation((matchID: string) => Promise.resolve({
      state: { G: { points } },
      metadata: { gameName, players: [{ name: matchID.replace("match-of-", "") }] },
    })),
  }) as unknown as StorageAPI.Async;

// `closeMatch` announces every match it closes (`team_manage.ts`), and a test
// run's report is meant to have the console to itself.
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("sweepStaleMatches", () => {
  // The regression: a match was only ever closed by the team's own browser, so
  // a team that closed the tab at the buzzer kept `IN PROGRESS` and no score.
  it("closes a match whose time has run out, with nobody playing it", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { relayMatch: running("match-of-alpha", RAN_OUT) });
    const teams = repositoryOf([alpha]);

    const result = await sweepStaleMatches(teams, storageOf(23));

    expect(result).toStrictEqual({ closed: ["match-of-alpha"], failed: [] });
    expect(alpha.update).toHaveBeenCalledWith({
      relayMatch: expect.objectContaining({ state: "FINISHED", matchID: "match-of-alpha", score: 23 }),
    });
  });

  it("leaves a match that is still running alone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { relayMatch: running("match-of-alpha", STILL_RUNNING) });

    const result = await sweepStaleMatches(repositoryOf([alpha]), storageOf(23));

    expect(result).toStrictEqual({ closed: [], failed: [] });
    expect(alpha.update).not.toHaveBeenCalled();
  });

  it("has nothing to do for a team that is not playing", async () => {
    const result = await sweepStaleMatches(repositoryOf([team("alpha")]), storageOf(23));

    expect(result).toStrictEqual({ closed: [], failed: [] });
  });

  // Unattended, so one match it cannot close must not cost every later team its
  // score — the failure this loop exists to survive.
  it("carries on past a match it cannot close, and names it", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { relayMatch: running("match-of-alpha", RAN_OUT) });
    const bravo = team("bravo", { relayMatch: running("match-of-bravo", RAN_OUT) });
    const db = storageOf(23);
    vi.mocked(db.fetch).mockImplementationOnce(() => { throw new Error("no such match"); });

    const result = await sweepStaleMatches(repositoryOf([alpha, bravo]), db);

    expect(result.closed).toStrictEqual(["match-of-bravo"]);
    expect(result.failed).toStrictEqual([{ matchID: "match-of-alpha", message: "no such match" }]);
    expect(bravo.update).toHaveBeenCalled();
  });

  it("closes a stale strategy match too", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { strategyMatch: running("match-of-alpha", RAN_OUT) });

    const result = await sweepStaleMatches(repositoryOf([alpha]), storageOf(12, "stones_e"));

    expect(result.closed).toStrictEqual(["match-of-alpha"]);
    expect(alpha.update).toHaveBeenCalledWith({
      strategyMatch: expect.objectContaining({ state: "FINISHED", score: 12 }),
    });
  });
});

describe("startStaleSweep", () => {
  it("sweeps on its interval until it is stopped", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { relayMatch: running("match-of-alpha", RAN_OUT) });
    const teams = repositoryOf([alpha]);

    const stop = startStaleSweep(teams, storageOf(23));
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
    expect(teams.listTeams).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
    expect(teams.listTeams).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS * 3);

    expect(teams.listTeams).toHaveBeenCalledTimes(2);
  });

  it("reports a sweep that closed something", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const alpha = team("alpha", { relayMatch: running("match-of-alpha", RAN_OUT) });
    const report = vi.fn();

    const stop = startStaleSweep(repositoryOf([alpha]), storageOf(23), report);
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
    stop();

    expect(report).toHaveBeenCalledWith({ closed: ["match-of-alpha"], failed: [] });
  });

  // A round where nothing has run out is the normal case, and a line a minute
  // saying so would bury the ones that matter.
  it("says nothing about a sweep with nothing to do", async () => {
    const report = vi.fn();

    const stop = startStaleSweep(repositoryOf([team("alpha")]), storageOf(23), report);
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
    stop();

    expect(report).not.toHaveBeenCalled();
  });

  // The loop runs unattended for the length of a round; a throw that escaped it
  // would be an unhandled rejection and the sweep would stop there.
  it("reports a sweep that threw rather than letting it escape", async () => {
    vi.useFakeTimers();
    const teams = { listTeams: vi.fn().mockRejectedValue(new Error("database is away")) } as unknown as TeamsRepository;
    const report = vi.fn();

    const stop = startStaleSweep(teams, storageOf(23), report);
    await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
    stop();

    expect(report).toHaveBeenCalledWith({
      closed: [],
      failed: [{ matchID: "(the sweep itself)", message: "Error: database is away" }],
    });
  });
});
