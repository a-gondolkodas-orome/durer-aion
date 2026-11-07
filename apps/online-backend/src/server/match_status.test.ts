import { describe, it, expect } from "vitest";
import type { Ctx, StorageAPI } from "boardgame.io";
import { BrokenTeamRowError, adminTeamViews, deriveMatchStatus, teamMatches } from "./match_status";
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
    expect(deriveMatchStatus("RELAY", "m1", { G: relayG, ctx: ctx() }, at(-1000))).toStrictEqual({
      state: "IN PROGRESS", matchID: "m1", startAt: new Date(START), endAt: new Date(END),
    });
  });

  // #639: the team closed the tab at the buzzer, so no move ever ended the game.
  it("is finished, with the game's points, once its time is up and nobody ended it", () => {
    expect(deriveMatchStatus("RELAY", "m1", { G: relayG, ctx: ctx() }, at(1000))).toStrictEqual({
      state: "FINISHED",
      matchID: "m1",
      startAt: new Date(START),
      endAt: new Date(END),
      score: 3,
      relayResults: [{ maxPoints: 3, points: 3, trySeconds: [120] }, { maxPoints: 4, points: 0, trySeconds: [] }],
    });
  });

  it("is finished as soon as the game ends, however much time is left", () => {
    expect(deriveMatchStatus("RELAY", "m1", { G: relayG, ctx: ctx({ gameover: true }) }, at(-60 * 1000)).state)
      .toBe("FINISHED");
  });

  // What an organiser's extension does: the end moves, and nothing else.
  it("is running again once its end is moved past now", () => {
    const extended = { ...relayG, end: at(5 * 60 * 1000).toISOString() };

    expect(deriveMatchStatus("RELAY", "m1", { G: extended, ctx: ctx() }, at(1000)).state)
      .toBe("IN PROGRESS");
  });

  it("carries a strategy match's results as the game recorded them", () => {
    expect(deriveMatchStatus("STRATEGY", "m1", { G: strategyG(), ctx: ctx() }, at(1000)))
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
    await expect(teamMatches(storage({}), { relayMatchID: "gone", strategyMatchID: null }, at(0)))
      .rejects.toBeInstanceOf(BrokenTeamRowError);
  });

  it("reads the match out of storage", async () => {
    expect((await teamMatches(storage({ m1: { G: relayG, ctx: ctx() } }), { relayMatchID: "m1", strategyMatchID: null }, at(-1000))).relayMatch)
      .toMatchObject({ state: "IN PROGRESS", matchID: "m1" });
  });
});

describe("adminTeamViews", () => {
  const storage = (states: Record<string, unknown>) =>
    ({ fetch: (id: string) => ({ state: states[id] }) }) as unknown as StorageAPI.Sync;
  const row = (relayMatchID: string | null, strategyMatchID: string | null) =>
    ({ relayMatchID, strategyMatchID, toJSON: () => ({}) }) as unknown as TeamModel;

  // #706: one broken row used to fail the whole list.
  it("marks a match storage does not have as BROKEN, and reads the rest", async () => {
    const views = await adminTeamViews(storage({ m1: { G: relayG, ctx: ctx() } }), [row("gone", "m1"), row("m1", null)]);

    expect(views.map(it => [it.relayMatch.state, it.strategyMatch.state])).toStrictEqual([
      ["BROKEN", "FINISHED"],
      ["FINISHED", "NOT STARTED"],
    ]);
    expect(views[0].relayMatch).toStrictEqual({ state: "BROKEN", matchID: "gone" });
  });
});
