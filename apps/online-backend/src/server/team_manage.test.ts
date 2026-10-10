import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { MatchStatus } from "schemas";
import { TeamModel } from "./model";
import { AnyBgioGame, strategyNames } from "game";
import { Server, StorageAPI } from "boardgame.io";
import { allowedToStart, checkStaleMatch, closeMatch, createGame, getNewGame, type MatchStore } from "./team_manage";

const inProgressUntil = (endAt: Date | string): MatchStatus =>
  ({
    state: "IN PROGRESS",
    matchID: "match-1",
    startAt: new Date("2026-03-21T10:00:00Z"),
    endAt,
  }) as MatchStatus;

const finished: MatchStatus = {
  state: "FINISHED",
  matchID: "match-1",
  startAt: new Date("2026-03-21T10:00:00Z"),
  endAt: new Date("2026-03-21T11:00:00Z"),
  score: 7,
};

/** Only the three fields the rules below look at; the rest of the row is irrelevant. */
const team = (fields: Partial<TeamModel>): TeamModel =>
  ({
    pageState: "HOME",
    relayMatch: { state: "NOT STARTED" },
    strategyMatch: { state: "NOT STARTED" },
    ...fields,
  }) as TeamModel;

/** The parts of the request context the code under test touches, over a `throw` that fails like Koa's. */
const appCtx = (fields: object = {}): Server.AppCtx =>
  ({
    throw: (status: number, message: string, props?: object) => {
      throw Object.assign(new Error(message), { status, ...props });
    },
    ...fields,
  }) as unknown as Server.AppCtx;

const bgioGame = (fields: object = {}): AnyBgioGame =>
  ({ name: "test", setup: () => ({}), moves: {}, ...fields });

/** A repository that has nothing and accepts every write, unless a test says otherwise. */
const matchStore = (fields: Partial<MatchStore> = {}): MatchStore => ({
  getTeam: async () => null,
  finishMatch: async () => true,
  ...fields,
});

// These rules are what stops a team from replaying a round for a better score,
// or from running the relay and the strategy clock at the same time.
describe("allowedToStart", () => {
  it("lets a team at the chooser start either round", async () => {
    expect(await allowedToStart(team({}), "RELAY")).toBe(true);
    expect(await allowedToStart(team({}), "STRATEGY")).toBe(true);
  });

  it("refuses a team that has not accepted the disclaimer yet", async () => {
    expect(await allowedToStart(team({ pageState: "DISCLAIMER" }), "RELAY")).toBe(false);
    expect(await allowedToStart(team({ pageState: "DISCLAIMER" }), "STRATEGY")).toBe(false);
  });

  it("refuses to restart the round the team is already on", async () => {
    const playing = team({
      pageState: "RELAY",
      relayMatch: inProgressUntil(new Date("2099-01-01T00:00:00Z")),
    });

    expect(await allowedToStart(playing, "RELAY")).toBe(false);
  });

  it("refuses to start the other round while one is running", async () => {
    const playingRelay = team({
      pageState: "HOME",
      relayMatch: inProgressUntil(new Date("2099-01-01T00:00:00Z")),
    });

    expect(await allowedToStart(playingRelay, "STRATEGY")).toBe(false);
  });

  it("refuses a round the team has already finished", async () => {
    expect(await allowedToStart(team({ relayMatch: finished }), "RELAY")).toBe(false);
    expect(await allowedToStart(team({ strategyMatch: finished }), "STRATEGY")).toBe(false);
  });

  it("still lets a team start the round it has not played", async () => {
    expect(await allowedToStart(team({ relayMatch: finished }), "STRATEGY")).toBe(true);
  });
});

// A match whose time ran out is closed on the team's next request, so a client
// that keeps quiet past the deadline — or reloads long after it — cannot go on
// playing a match the server still believes is running.
describe("checkStaleMatch", () => {
  it("reports a running match that is past its end time", async () => {
    const expired = team({
      relayMatch: inProgressUntil(new Date(Date.now() - 1000)),
    });

    expect(await checkStaleMatch(expired)).toStrictEqual({
      isStale: true,
      gameState: "relayMatch",
    });
  });

  it("leaves a match that is still running alone", async () => {
    const running = team({
      strategyMatch: inProgressUntil(new Date(Date.now() + 60 * 1000)),
    });

    expect(await checkStaleMatch(running)).toStrictEqual({ isStale: false });
  });

  // The match status is a JSON column, so a reloaded row carries endAt as the
  // string it was serialised to rather than as a Date.
  it("reads an end time that came back from the database as a string", async () => {
    const expired = team({
      strategyMatch: inProgressUntil(new Date(Date.now() - 1000).toISOString()),
    });

    expect(await checkStaleMatch(expired)).toStrictEqual({
      isStale: true,
      gameState: "strategyMatch",
    });
  });

  it("has nothing to close for a team that has not started anything", async () => {
    expect(await checkStaleMatch(team({}))).toStrictEqual({ isStale: false });
  });
});

describe("getNewGame", () => {
  it("finds the game registered for the team's category", async () => {
    const games = [bgioGame({ name: strategyNames.D })];

    const { game } = await getNewGame(appCtx(), matchStore(), games, "STRATEGY", team({ category: "D" }));

    expect(game.name).toBe(strategyNames.D);
  });
});

// boardgame.io serves listed matches, metadata and all, from an
// unauthenticated `GET /games/:name`, and that metadata names the playing
// team by its GUID — which is what the session cookie carries.
describe("createGame", () => {
  it("creates the match unlisted", async () => {
    const created: Server.MatchData[] = [];
    const ctx = appCtx({
      db: { createMatch: (_id: string, match: { metadata: Server.MatchData }) => created.push(match.metadata) },
    });

    await createGame(bgioGame(), ctx);

    expect(created).toHaveLength(1);
    expect(created[0].unlisted).toBe(true);
  });
});

describe("closeMatch", () => {
  beforeEach(() => { vi.spyOn(console, "log").mockImplementation(() => undefined); });
  afterEach(() => { vi.restoreAllMocks(); });

  /** `written` is what the repository's conditional write reports: false when
   * the stored match id no longer matches by the time it runs. */
  const closing = (matchId: string, points: number, strategyMatch: MatchStatus, written = true) => {
    const writes: unknown[][] = [];
    const teams = matchStore({
      getTeam: async () => team({ strategyMatch }),
      finishMatch: async (...args: unknown[]) => { writes.push(args); return written; },
    });
    const db = {
      fetch: async () => ({
        state: { G: { points, liveResults: ["lost", "won", "won"] } },
        metadata: { gameName: "stones_e", players: { 0: { name: "team-1" } } },
      }),
    } as unknown as StorageAPI.Async;
    return { writes, close: () => closeMatch(matchId, teams, db) };
  };

  it("finishes the team's current match with the game's points", async () => {
    const { writes, close } = closing("match-1", 9, inProgressUntil(new Date("2026-03-21T11:00:00Z")));

    await close();

    expect(writes).toStrictEqual([["team-1", "strategyMatch", "match-1", { ...finished, score: 9, liveGames: ["lost", "won", "won"] }]]);
  });

  it("finishes a relay match with each problem's points and tries", async () => {
    const writes: unknown[][] = [];
    const teams = matchStore({
      getTeam: async () => team({ relayMatch: inProgressUntil(new Date("2026-03-21T11:00:00Z")) }),
      finishMatch: async (...args: unknown[]) => { writes.push(args); return true; },
    });
    const G = {
      points: 3,
      maxPointsList: [3, 4],
      previousPoints: [3],
      previousAnswers: [[{ answer: 1, date: "" }], []],
    };
    const db = {
      fetch: async () => ({ state: { G }, metadata: { gameName: "relay_e", players: { 0: { name: "team-1" } } } }),
    } as unknown as StorageAPI.Async;

    await closeMatch("match-1", teams, db);

    expect(writes).toStrictEqual([["team-1", "relayMatch", "match-1", {
      ...finished,
      score: 3,
      relayProblems: [{ maxPoints: 3, points: 3, tries: 1 }, { maxPoints: 4, points: 0, tries: 0 }],
    }]]);
  });

  it("closes a finished match again with the points boardgame.io ended it on", async () => {
    const { writes, close } = closing("match-1", 9, finished);

    await close();

    expect(writes).toStrictEqual([["team-1", "strategyMatch", "match-1", { ...finished, score: 9, liveGames: ["lost", "won", "won"] }]]);
  });

  it("leaves the team's new match alone when a match replaced by a reset ends", async () => {
    const { writes, close } = closing("match-before-reset", 12, inProgressUntil(new Date("2026-03-21T11:00:00Z")));

    await close();

    expect(writes).toStrictEqual([]);
  });

  it("leaves a reset match alone when the old match ends before the team restarts", async () => {
    const { writes, close } = closing("match-before-reset", 12, { state: "NOT STARTED" });

    await expect(close()).resolves.toBeUndefined();
    expect(writes).toStrictEqual([]);
  });

  it("gives up quietly when a reset lands between reading the team and writing it", async () => {
    const { close } = closing("match-1", 9, inProgressUntil(new Date("2026-03-21T11:00:00Z")), false);

    await expect(close()).resolves.toBeUndefined();
  });
});
