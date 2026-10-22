import { it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StorageAPI } from "boardgame.io";
import type { MatchStatus } from "schemas";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { closeStaleMatches, STALE_GRACE_MS } from "./stale_sweep";

const NOW = new Date("2026-03-21T12:00:00Z");
const RAN_OUT = new Date("2026-03-21T11:00:00Z");
const JUST_RAN_OUT = new Date(NOW.getTime() - STALE_GRACE_MS / 2);
const STILL_RUNNING = new Date("2099-01-01T00:00:00Z");

const running = (matchID: string, endAt: Date): MatchStatus =>
  ({ state: "IN PROGRESS", matchID, startAt: new Date("2026-03-21T10:00:00Z"), endAt });

/** Only the fields the sweep and `closeMatch` read. */
const team = (teamId: string, fields: Partial<TeamModel> = {}) => ({
  teamId,
  relayMatch: { state: "NOT STARTED" },
  strategyMatch: { state: "NOT STARTED" },
  ...fields,
}) as unknown as TeamModel;

const repositoryOf = (rows: TeamModel[]) => ({
  listTeams: vi.fn().mockResolvedValue(rows),
  getTeam: vi.fn().mockImplementation(({ teamId }: { teamId: string }) =>
    Promise.resolve(rows.find(row => row.teamId === teamId) ?? null)),
  finishMatch: vi.fn().mockResolvedValue(true),
}) as unknown as TeamsRepository;

/** The teams the sweep wrote a finished match for, by id. */
const finishedTeams = (teams: TeamsRepository) =>
  vi.mocked(teams.finishMatch).mock.calls.map(([teamId]) => teamId);

/** What `closeMatch` reads off a match: its score, the relay's per-problem
 *  record (empty here), and the game and team it belongs to, which pick the
 *  team's column and row. */
const storageOf = (matches: Record<string, { gameName: string, teamId: string, points: number }>) => ({
  fetch: vi.fn().mockImplementation((matchID: string) => {
    const { gameName, teamId, points } = matches[matchID];
    return Promise.resolve({ state: { G: { points, maxPointsList: [], previousPoints: [], previousAnswers: [] } }, metadata: { gameName, players: [{ name: teamId }] } });
  }),
}) as unknown as StorageAPI.Async;

beforeEach(() => {
  // `closeMatch` announces every match it closes.
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// The bug: with every close path needing the team's own browser, a team that
// closes the tab at the buzzer sits on `IN PROGRESS` with no score.
it("closes both kinds of stale match and leaves a running one alone", async () => {
  const alpha = team("alpha", { relayMatch: running("m1", RAN_OUT) });
  const bravo = team("bravo", { strategyMatch: running("m2", RAN_OUT) });
  const charlie = team("charlie", { relayMatch: running("m3", STILL_RUNNING) });
  const db = storageOf({
    m1: { gameName: "relay_c", teamId: "alpha", points: 23 },
    m2: { gameName: "stones_e", teamId: "bravo", points: 5 },
  });
  const onError = vi.fn();
  const teams = repositoryOf([alpha, bravo, charlie]);

  await closeStaleMatches(teams, db, onError);

  expect(teams.finishMatch).toHaveBeenCalledWith("alpha", "relayMatch", "m1", expect.objectContaining({ state: "FINISHED", score: 23 }));
  expect(teams.finishMatch).toHaveBeenCalledWith("bravo", "strategyMatch", "m2", expect.objectContaining({ state: "FINISHED", score: 5 }));
  expect(finishedTeams(teams)).toStrictEqual(["alpha", "bravo"]);
  expect(onError).not.toHaveBeenCalled();
});

// What postgres hands back: the JSON column's dates are strings.
it("reads an end time stored as a string", async () => {
  const alpha = team("alpha", { relayMatch: { ...running("m1", RAN_OUT), endAt: RAN_OUT.toISOString() } as unknown as MatchStatus });
  const teams = repositoryOf([alpha]);

  await closeStaleMatches(teams, storageOf({ m1: { gameName: "relay_c", teamId: "alpha", points: 23 } }), vi.fn());

  expect(finishedTeams(teams)).toStrictEqual(["alpha"]);
});

// The game still takes a move for a few seconds past `endAt`, and that move
// closes the match itself; closing it here first could leave the earlier score.
it("leaves a match that ran out inside the grace period to the team's last move", async () => {
  const alpha = team("alpha", { relayMatch: running("m1", JUST_RAN_OUT) });
  const db = storageOf({});
  const teams = repositoryOf([alpha]);

  await closeStaleMatches(teams, db, vi.fn());

  expect(teams.finishMatch).not.toHaveBeenCalled();
  expect(db.fetch).not.toHaveBeenCalled();
});

// Unattended, so one match it cannot close must not cost every later team its score.
it("carries on past a match it cannot close, and hands on its error", async () => {
  const alpha = team("alpha", { relayMatch: running("m1", RAN_OUT) });
  const bravo = team("bravo", { relayMatch: running("m2", RAN_OUT) });
  const db = storageOf({ m2: { gameName: "relay_c", teamId: "bravo", points: 23 } });
  const failure = new Error("no such match");
  vi.mocked(db.fetch).mockRejectedValueOnce(failure);
  const onError = vi.fn();
  const teams = repositoryOf([alpha, bravo]);

  await closeStaleMatches(teams, db, onError);

  expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
  expect(finishedTeams(teams)).toStrictEqual(["bravo"]);
});
