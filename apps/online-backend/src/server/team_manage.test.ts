import { describe, it, expect } from "vitest";
import { MatchStatus } from "schemas";
import { TeamModel } from "./model";
import { AnyBgioGame, strategyNames } from "game";
import { Server } from "boardgame.io";
import { allowedToStart, createGame, extendedEnd, extensionRefusal, getNewGame } from "./team_manage";
import type { TeamMatches } from "./match_status";

const running: MatchStatus = {
  state: "IN PROGRESS",
  matchID: "match-1",
  startAt: new Date("2026-03-21T10:00:00Z"),
  endAt: new Date("2099-01-01T00:00:00Z"),
};

const finished: MatchStatus = {
  state: "FINISHED",
  matchID: "match-1",
  startAt: new Date("2026-03-21T10:00:00Z"),
  endAt: new Date("2026-03-21T11:00:00Z"),
  score: 7,
};

/** Only the fields the rules below look at; the rest of the row is irrelevant. */
const team = (fields: Partial<TeamModel>): TeamModel =>
  ({
    pageState: "HOME",
    relayMatchID: null,
    strategyMatchID: null,
    ...fields,
  }) as TeamModel;

const matches = (fields: Partial<TeamMatches> = {}): TeamMatches => ({
  relayMatch: { state: "NOT STARTED" },
  strategyMatch: { state: "NOT STARTED" },
  ...fields,
});

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

// These rules are what stops a team from replaying a round for a better score,
// or from running the relay and the strategy clock at the same time.
describe("allowedToStart", () => {
  it("lets a team at the chooser start either round", () => {
    expect(allowedToStart(team({}), matches(), "RELAY")).toBe(true);
    expect(allowedToStart(team({}), matches(), "STRATEGY")).toBe(true);
  });

  it("refuses a team that has not accepted the disclaimer yet", () => {
    expect(allowedToStart(team({ pageState: "DISCLAIMER" }), matches(), "RELAY")).toBe(false);
    expect(allowedToStart(team({ pageState: "DISCLAIMER" }), matches(), "STRATEGY")).toBe(false);
  });

  it("refuses to restart the round the team is already on", () => {
    expect(allowedToStart(team({ pageState: "RELAY" }), matches({ relayMatch: running }), "RELAY")).toBe(false);
  });

  it("refuses to start the other round while one is running", () => {
    expect(allowedToStart(team({}), matches({ relayMatch: running }), "STRATEGY")).toBe(false);
  });

  it("refuses a round the team has already finished", () => {
    expect(allowedToStart(team({}), matches({ relayMatch: finished }), "RELAY")).toBe(false);
    expect(allowedToStart(team({}), matches({ strategyMatch: finished }), "STRATEGY")).toBe(false);
  });

  it("still lets a team start the round it has not played", () => {
    expect(allowedToStart(team({}), matches({ relayMatch: finished }), "STRATEGY")).toBe(true);
  });
});

describe("extensionRefusal", () => {
  const playing = team({ relayMatchID: "match-1" });

  it("extends the team's running match", () => {
    expect(extensionRefusal(playing, "match-1", undefined, matches({ relayMatch: running }))).toBeNull();
  });

  // The team whose laptop died phones after the buzzer.
  it("extends a match whose time is up but whose game nobody ended", () => {
    expect(extensionRefusal(playing, "match-1", undefined, matches({ relayMatch: finished }))).toBeNull();
  });

  it("refuses a match the game itself has ended", () => {
    expect(extensionRefusal(playing, "match-1", { winner: "0" }, matches({ relayMatch: finished }))).toMatch(/ended/);
  });

  it("refuses a match that is not the team's current one", () => {
    expect(extensionRefusal(playing, "match-0", undefined, matches({ relayMatch: running }))).toMatch(/not the team's/);
  });

  // Reopening it would leave the team with both matches running.
  it("refuses a match the team has left for its other one", () => {
    const moved = team({ relayMatchID: "match-1", strategyMatchID: "match-2" });
    const both = matches({ relayMatch: finished, strategyMatch: { ...running, matchID: "match-2" } });

    expect(extensionRefusal(moved, "match-1", undefined, both)).toMatch(/other match/);
  });
});

describe("extendedEnd", () => {
  const END = "2026-03-21T11:00:00.000Z";

  it("moves a running match's end", () => {
    expect(extendedEnd(END, 5, new Date("2026-03-21T10:30:00Z"))).toStrictEqual(new Date("2026-03-21T11:05:00Z"));
  });

  // Otherwise an extension asked for after the buzzer is partly spent before
  // it is given.
  it("counts from now for a match whose end has passed", () => {
    expect(extendedEnd(END, 5, new Date("2026-03-21T11:04:00Z"))).toStrictEqual(new Date("2026-03-21T11:09:00Z"));
  });
});

describe("getNewGame", () => {
  it("finds the game registered for the team's category", async () => {
    const games = [bgioGame({ name: strategyNames.D })];

    const { game } = await getNewGame(appCtx({ db: {} }), games, "STRATEGY", team({ category: "D" }));

    expect(game.name).toBe(strategyNames.D);
  });
});

// boardgame.io's lobby listing serves listed matches, metadata and all, and
// that metadata names the playing team by its GUID — which is what the session
// cookie carries. The listing is closed (server/router.ts); this is the second
// line of defence.
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
