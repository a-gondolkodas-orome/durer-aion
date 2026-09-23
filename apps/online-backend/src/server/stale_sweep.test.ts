import { it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StorageAPI } from "boardgame.io";
import type { MatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { closeStaleMatches } from "./stale_sweep";

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

// The bug: with every close path needing the team's own browser, a team that
// closes the tab at the buzzer sits on `IN PROGRESS` with no score.
it("closes both kinds of stale match and leaves a running one alone", async () => {
  const alpha = team("alpha", { relayMatch: running("relay-alpha", RAN_OUT) });
  const bravo = team("bravo", { strategyMatch: running("strategy-bravo", RAN_OUT) });
  const charlie = team("charlie", { relayMatch: running("relay-charlie", STILL_RUNNING) });
  const onError = vi.fn();

  await closeStaleMatches(repositoryOf([alpha, bravo, charlie]), storage(), onError);

  expect(alpha.update).toHaveBeenCalledWith({ relayMatch: expect.objectContaining({ state: "FINISHED", score: 23 }) });
  expect(bravo.update).toHaveBeenCalledWith({
    strategyMatch: expect.objectContaining({ state: "FINISHED", score: 23 }),
  });
  expect(charlie.update).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

// Unattended, so one match it cannot close must not cost every later team its score.
it("carries on past a match it cannot close, and hands on its error", async () => {
  const alpha = team("alpha", { relayMatch: running("relay-alpha", RAN_OUT) });
  const bravo = team("bravo", { relayMatch: running("relay-bravo", RAN_OUT) });
  const db = storage();
  const failure = new Error("no such match");
  vi.mocked(db.fetch).mockRejectedValueOnce(failure);
  const onError = vi.fn();

  await closeStaleMatches(repositoryOf([alpha, bravo]), db, onError);

  expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
  expect(alpha.update).not.toHaveBeenCalled();
  expect(bravo.update).toHaveBeenCalledWith({ relayMatch: expect.objectContaining({ state: "FINISHED" }) });
});
