import { it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StorageAPI } from "boardgame.io";
import type { MatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { STALE_SWEEP_INTERVAL_MS, startStaleSweep, sweepStaleMatches } from "./stale_sweep";

const RAN_OUT = new Date("2026-03-21T11:00:00Z");
const STILL_RUNNING = new Date("2099-01-01T00:00:00Z");

const running = (matchID: string, endAt: Date): MatchStatus =>
  ({ state: "IN PROGRESS", matchID, startAt: new Date("2026-03-21T10:00:00Z"), endAt });

/** Only the fields the sweep and `closeMatch` read. */
const team = (teamId: string, fields: Partial<TeamModel> = {}) => ({
  teamId,
  relayMatch: { state: "NOT STARTED" },
  strategyMatch: { state: "NOT STARTED" },
  update: vi.fn().mockResolvedValue(undefined),
  ...fields,
}) as unknown as TeamModel;

const repositoryOf = (rows: TeamModel[]) => ({
  listTeams: vi.fn().mockResolvedValue(rows),
  getTeam: vi.fn().mockImplementation(({ teamId }: { teamId: string }) =>
    Promise.resolve(rows.find(row => row.teamId === teamId) ?? null)),
}) as unknown as TeamsRepository;

/** Answers for any match: its score, the team that owns it, and — off the id —
 *  the game name `closeMatch` picks the team's column from. */
const storage = (points = 23) => ({
  fetch: vi.fn().mockImplementation((matchID: string) => Promise.resolve({
    state: { G: { points } },
    metadata: {
      gameName: matchID.startsWith("strategy") ? "stones_e" : "relay_c",
      players: [{ name: matchID.split("-").pop() }],
    },
  })),
}) as unknown as StorageAPI.Async;

beforeEach(() => {
  // `closeMatch` announces every match it closes.
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-21T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// The regression: a match was only ever closed by the team's own browser, so a
// team that closed the tab at the buzzer kept `IN PROGRESS` and no score.
it("closes both kinds of stale match and leaves a running one alone", async () => {
  const alpha = team("alpha", { relayMatch: running("relay-alpha", RAN_OUT) });
  const bravo = team("bravo", { strategyMatch: running("strategy-bravo", RAN_OUT) });
  const charlie = team("charlie", { relayMatch: running("relay-charlie", STILL_RUNNING) });

  const result = await sweepStaleMatches(repositoryOf([alpha, bravo, charlie]), storage());

  expect(result).toStrictEqual({ closed: ["relay-alpha", "strategy-bravo"], failed: [] });
  expect(alpha.update).toHaveBeenCalledWith({ relayMatch: expect.objectContaining({ state: "FINISHED", score: 23 }) });
  expect(bravo.update).toHaveBeenCalledWith({
    strategyMatch: expect.objectContaining({ state: "FINISHED", score: 23 }),
  });
  expect(charlie.update).not.toHaveBeenCalled();
});

// Unattended, so one match it cannot close must not cost every later team its score.
it("carries on past a match it cannot close, and names it", async () => {
  const alpha = team("alpha", { relayMatch: running("relay-alpha", RAN_OUT) });
  const bravo = team("bravo", { relayMatch: running("relay-bravo", RAN_OUT) });
  const db = storage();
  vi.mocked(db.fetch).mockImplementationOnce(() => { throw new Error("no such match"); });

  const result = await sweepStaleMatches(repositoryOf([alpha, bravo]), db);

  expect(result.closed).toStrictEqual(["relay-bravo"]);
  expect(result.failed).toStrictEqual([{ matchID: "relay-alpha", message: "no such match" }]);
});

it("sweeps on its interval until it is stopped", async () => {
  const teams = repositoryOf([team("alpha", { relayMatch: running("relay-alpha", RAN_OUT) })]);

  const stop = startStaleSweep(teams, storage());
  await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
  expect(teams.listTeams).toHaveBeenCalledTimes(1);

  stop();
  await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS * 3);

  expect(teams.listTeams).toHaveBeenCalledTimes(1);
});

// A throw that escaped the interval would be an unhandled rejection, which ends
// the process and every match being played on it.
it("reports a sweep that threw rather than letting it escape", async () => {
  const teams = { listTeams: vi.fn().mockRejectedValue(new Error("database is away")) } as unknown as TeamsRepository;
  const report = vi.fn();

  const stop = startStaleSweep(teams, storage(), report);
  await vi.advanceTimersByTimeAsync(STALE_SWEEP_INTERVAL_MS);
  stop();

  expect(report).toHaveBeenCalledWith({
    closed: [],
    failed: [{ matchID: "(the sweep itself)", message: "Error: database is away" }],
  });
});
