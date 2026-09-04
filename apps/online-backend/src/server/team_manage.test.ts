import { describe, it, expect } from "vitest";
import { MatchStatus } from "schemas";
import { TeamModel } from "./model";
import { AnyBgioGame } from "game";
import { Server } from "boardgame.io";
import { allowedToStart, checkStaleMatch, createGame } from "./team_manage";

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

// boardgame.io serves listed matches, metadata and all, from an
// unauthenticated `GET /games/:name`, and that metadata names the playing
// team by its GUID — the capability for every team route.
describe("createGame", () => {
  it("creates the match unlisted", async () => {
    const game = { name: "test", setup: () => ({}), moves: {} } as unknown as AnyBgioGame;
    const created: Server.MatchData[] = [];
    const ctx = {
      db: { createMatch: (_id: string, match: { metadata: Server.MatchData }) => created.push(match.metadata) },
      throw: (_status: number, message: string) => { throw new Error(message); },
    } as unknown as Server.AppCtx;

    await createGame(game, ctx);

    expect(created).toHaveLength(1);
    expect(created[0].unlisted).toBe(true);
  });
});
