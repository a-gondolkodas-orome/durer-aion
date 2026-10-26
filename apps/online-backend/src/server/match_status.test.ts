import { describe, it, expect, vi } from "vitest";
import type { Ctx, StorageAPI } from "boardgame.io";
import { adminTeamViews, deriveMatchStatus, teamMatches } from "./match_status";
import type { TeamModel } from "./model";

const START = "2026-03-21T10:00:00.000Z";
const END = "2026-03-21T11:00:00.000Z";
const at = (offsetMs: number) => new Date(new Date(END).getTime() + offsetMs);

const relayG = {
  start: START,
  end: END,
  points: 3,
  maxPointsList: [3, 4],
  previousPoints: [3],
  previousAnswers: [[{ answer: 1, date: "2026-03-21T10:02:00.000Z" }], []],
};

/** A strategy match in the middle of a live game nobody has won yet. */
const strategyG = (fields: object = {}) => ({
  start: START,
  end: END,
  points: 0,
  difficulty: "live",
  winner: null,
  liveResults: ["lost", "won"],
  ...fields,
});

const ctx = (fields: Partial<Ctx> = {}) => ({ phase: "play", ...fields }) as Ctx;

describe("deriveMatchStatus", () => {
  it("is running before its end", () => {
    expect(deriveMatchStatus("relayMatchID", "m1", { G: relayG, ctx: ctx() }, at(-1000))).toStrictEqual({
      state: "IN PROGRESS", matchID: "m1", startAt: new Date(START), endAt: new Date(END),
    });
  });

  // #639: the team closed the tab at the buzzer, so no move ever ended the game.
  it("is finished, with the game's points, once its time is up and nobody ended it", () => {
    expect(deriveMatchStatus("relayMatchID", "m1", { G: relayG, ctx: ctx() }, at(1000))).toStrictEqual({
      state: "FINISHED",
      matchID: "m1",
      startAt: new Date(START),
      endAt: new Date(END),
      score: 3,
      relayResults: [{ maxPoints: 3, points: 3, trySeconds: [120] }, { maxPoints: 4, points: 0, trySeconds: [] }],
    });
  });

  it("is finished as soon as the game ends, however much time is left", () => {
    expect(deriveMatchStatus("relayMatchID", "m1", { G: relayG, ctx: ctx({ gameover: true }) }, at(-60 * 1000)).state)
      .toBe("FINISHED");
  });

  // What an organiser's extension does: the end moves, and nothing else.
  it("is running again once its end is moved past now", () => {
    const extended = { ...relayG, end: at(5 * 60 * 1000).toISOString() };

    expect(deriveMatchStatus("relayMatchID", "m1", { G: extended, ctx: ctx() }, at(1000)).state)
      .toBe("IN PROGRESS");
  });

  it("carries a strategy match's results as the game recorded them", () => {
    expect(deriveMatchStatus("strategyMatchID", "m1", { G: strategyG(), ctx: ctx() }, at(1000)))
      .toMatchObject({ state: "FINISHED", score: 0, strategyResults: ["lost", "won"] });
  });
});

describe("teamMatches", () => {
  const storage = (states: Record<string, unknown>) =>
    ({ fetch: (id: string) => ({ state: states[id] }) }) as unknown as StorageAPI.Sync;

  it("is NOT STARTED for a team with no match of that kind", async () => {
    expect(await teamMatches(storage({}), { relayMatchID: null, strategyMatchID: null }, at(0))).toStrictEqual({
      relayMatch: { state: "NOT STARTED" }, strategyMatch: { state: "NOT STARTED" },
    });
  });

  it("refuses a match storage does not have, rather than inventing its state", async () => {
    await expect(teamMatches(storage({}), { relayMatchID: "gone", strategyMatchID: null }, at(0))).rejects.toThrow("gone");
  });

  it("reads the match out of storage", async () => {
    expect((await teamMatches(storage({ m1: { G: relayG, ctx: ctx() } }), { relayMatchID: "m1", strategyMatchID: null }, at(-1000))).relayMatch)
      .toMatchObject({ state: "IN PROGRESS", matchID: "m1" });
  });
});

describe("adminTeamViews", () => {
  const row = (fields: object) => ({ ...fields, toJSON: () => fields }) as unknown as TeamModel;

  // The admin list is where an organiser finds the broken team, so one such
  // row must not take the list down with it.
  it("serves a match storage does not have as MISSING, and the other teams as they are", async () => {
    const storage = { fetch: (id: string) => ({ state: id === "m1" ? { G: relayG, ctx: ctx() } : undefined }) } as unknown as StorageAPI.Sync;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const views = await adminTeamViews(storage, [
      row({ teamId: "a", relayMatchID: "m1", strategyMatchID: null }),
      row({ teamId: "b", relayMatchID: "gone", strategyMatchID: null }),
    ], at(-1000));

    expect(views.map(view => view.relayMatch.state)).toStrictEqual(["IN PROGRESS", "MISSING"]);
    expect(views[1].relayMatch).toStrictEqual({ state: "MISSING", matchID: "gone" });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("gone"));
  });
});
