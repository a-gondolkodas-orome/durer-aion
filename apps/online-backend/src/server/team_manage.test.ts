import { MatchStatus } from "schemas";
import { TeamModel } from "./model";
import { AnyBgioGame } from "game";
import { relayGameName, strategyGameName } from "schemas";
import type { CompetitionConfig } from "schemas";
import { Server } from "boardgame.io";
import { allowedToStart, allowedToViewStrategy, createGame, getNewGame } from "./team_manage";
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

describe("allowedToViewStrategy", () => {
  it("lets a team at the chooser go back to its finished strategy match", () => {
    expect(allowedToViewStrategy(team({}), matches({ strategyMatch: finished }))).toBe(true);
    expect(allowedToViewStrategy(team({}), matches({ strategyMatch: finished, relayMatch: finished }))).toBe(true);
  });

  it("refuses a strategy match that has not ended", () => {
    expect(allowedToViewStrategy(team({}), matches())).toBe(false);
    expect(allowedToViewStrategy(team({ pageState: "STRATEGY" }), matches({ strategyMatch: running }))).toBe(false);
  });

  it("refuses while the relay runs, or from anywhere but the chooser", () => {
    expect(allowedToViewStrategy(team({ pageState: "RELAY" }), matches({ strategyMatch: finished, relayMatch: running }))).toBe(false);
    expect(allowedToViewStrategy(team({ pageState: "DISCLAIMER" }), matches({ strategyMatch: finished }))).toBe(false);
  });
});

describe("getNewGame", () => {
  const relayOnly: CompetitionConfig = {
    id: "aaaaaaaaaa--relay-only",
    languages: ["hu"],
    relay: { durationMinutes: 60, problems: [] },
    metadata: { kind: "other", label: { hu: "Csak váltó" } },
  };
  const competitions = new Map([[relayOnly.id, relayOnly]]);
  const games = [bgioGame({ name: relayGameName(relayOnly.id) }), bgioGame({ name: strategyGameName("other") })];

  it("finds the game registered for the team's competition", async () => {
    const { game } = await getNewGame(
      appCtx({ db: {} }), games, "RELAY", team({ competitionId: relayOnly.id }), competitions);

    expect(game.name).toBe(relayGameName(relayOnly.id));
  });

  it("refuses with 403 a match the team's competition does not have", async () => {
    await expect(getNewGame(appCtx({ db: {} }), games, "STRATEGY", team({ competitionId: relayOnly.id }), competitions))
      .rejects.toMatchObject({ status: 403 });
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
