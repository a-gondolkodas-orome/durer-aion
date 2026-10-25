import { describe, it, expect } from "vitest";
import type { Ctx, StorageAPI } from "boardgame.io";
import { deriveMatchStatus, matchStatus } from "./match_status";

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

describe("matchStatus", () => {
  const storage = (state: unknown) => ({ fetch: () => ({ state }) }) as unknown as StorageAPI.Sync;

  it("is NOT STARTED for a team with no match of that kind", async () => {
    expect(await matchStatus(storage(undefined), "relayMatchID", null, at(0))).toStrictEqual({ state: "NOT STARTED" });
  });

  it("refuses a match storage does not have, rather than inventing its state", async () => {
    await expect(matchStatus(storage(undefined), "relayMatchID", "gone", at(0))).rejects.toThrow("gone");
  });

  it("reads the match out of storage", async () => {
    expect(await matchStatus(storage({ G: relayG, ctx: ctx() }), "relayMatchID", "m1", at(-1000)))
      .toMatchObject({ state: "IN PROGRESS", matchID: "m1" });
  });
});
