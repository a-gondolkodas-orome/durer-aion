import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StorageAPI } from "boardgame.io";
import type { AnyBgioGame } from "game";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { addMinutesToMatch, grantMarker, type MatchClock, type MatchQueue } from "./add_minutes";

const MATCH = "0EKBiMgbJ5A";
const TEAM_ID = "8eae8669-125c-42e5-8b49-89afbac31679";
const START = "2026-03-21T18:00:00.000Z";
const END = "2026-03-21T19:00:00.000Z";

const team = (fields: Partial<TeamModel> = {}) =>
  ({
    teamId: TEAM_ID,
    teamName: "Alpha",
    other: "Radnóti",
    relayMatch: { state: "IN PROGRESS", matchID: MATCH, startAt: new Date(START), endAt: new Date(END) },
    strategyMatch: { state: "NOT STARTED" },
    update: vi.fn().mockResolvedValue(undefined),
    ...fields,
  }) as unknown as TeamModel;

/** Storage holding one match of `gameName`, owned by the team — or by nobody,
 *  which is what an unfilled player slot looks like. */
const storage = (options: { gameName?: string; unnamed?: boolean; missing?: boolean } = {}) =>
  ({
    fetch: vi.fn().mockResolvedValue(options.missing ? {} : {
      state: { _stateID: 7, G: { start: START, end: END, points: 3 }, ctx: {} },
      metadata: {
        gameName: options.gameName ?? "relay_c",
        players: [{ name: options.unnamed === true ? undefined : TEAM_ID }],
      },
    }),
    setState: vi.fn().mockResolvedValue(undefined),
  }) as unknown as StorageAPI.Async;

/** Runs a task the moment it is handed over, as an idle queue would. */
const immediateQueue = (): MatchQueue => ({ add: task => task() });

const clockOf = (
  rows: TeamModel[],
  db: StorageAPI.Async,
  queueFor: (matchID: string) => MatchQueue = immediateQueue,
): MatchClock => ({
  db,
  teams: {
    getTeam: vi.fn().mockImplementation(({ teamId }: { teamId: string }) =>
      Promise.resolve(rows.find(row => row.teamId === teamId) ?? null)),
  } as unknown as TeamsRepository,
  games: [{ name: "relay_c" } as AnyBgioGame],
  queueFor,
  pubSub: { publish: vi.fn() } as unknown as MatchClock["pubSub"],
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-21T18:30:00.000Z"));
});

describe("addMinutesToMatch", () => {
  it("moves the match's end, the team's row and the board together", async () => {
    const alpha = team();
    const db = storage();
    const clock = clockOf([alpha], db);

    const result = await addMinutesToMatch(clock, { matchID: MATCH, minutes: 10 });

    expect(result).toMatchObject({ status: "extended", matchID: MATCH });
    const extendedTo = new Date("2026-03-21T19:10:00.000Z");
    expect(alpha.update).toHaveBeenCalledWith({
      relayMatch: { state: "IN PROGRESS", matchID: MATCH, startAt: new Date(START), endAt: extendedTo },
      other: `Radnóti te[${MATCH}]:10`,
    });
    expect(vi.mocked(db.setState)).toHaveBeenCalledWith(MATCH, expect.objectContaining({
      _stateID: 8,
      G: expect.objectContaining({ end: extendedTo.toISOString() }),
    }));
    expect(vi.mocked(clock.pubSub.publish)).toHaveBeenCalledOnce();
  });

  // The regression this module exists for: the handler it replaces fetched the
  // state outside any lock, computed `_stateID + 1` from it and wrote that back
  // — and `bgio-postgres` drops a write whose id is not strictly higher, so a
  // move landing in between made the extension vanish with no error. Reading
  // inside the match's own queue is what makes claiming the next id safe.
  it("reads the match inside the queue, not before it", async () => {
    const db = storage();
    // A queue that takes the task and holds it, the way a busy one would while
    // the bot's move is still running.
    const held: (() => Promise<unknown>)[] = [];
    const clock = clockOf([team()], db, () => ({
      add: task => { held.push(task); return new Promise<never>(() => undefined); },
    }));

    void addMinutesToMatch(clock, { matchID: MATCH, minutes: 10 });

    expect(vi.mocked(db.fetch)).not.toHaveBeenCalled();
    await held[0]();
    expect(vi.mocked(db.fetch)).toHaveBeenCalledOnce();
  });

  it("asks for the queue belonging to the match it is extending", async () => {
    const queueFor = vi.fn().mockReturnValue(immediateQueue());

    await addMinutesToMatch(clockOf([team()], storage(), queueFor), { matchID: MATCH, minutes: 10 });

    expect(queueFor).toHaveBeenCalledWith(MATCH);
  });

  it("extends a running strategy match the same way", async () => {
    const alpha = team({
      relayMatch: { state: "NOT STARTED" },
      strategyMatch: { state: "IN PROGRESS", matchID: MATCH, startAt: new Date(START), endAt: new Date(END) },
    });

    await addMinutesToMatch(clockOf([alpha], storage()), { matchID: MATCH, minutes: 5 });

    expect(alpha.update).toHaveBeenCalledWith(expect.objectContaining({
      strategyMatch: expect.objectContaining({ endAt: new Date("2026-03-21T19:05:00.000Z") }),
    }));
  });
});

describe("what addMinutesToMatch refuses", () => {
  const refusalOf = async (clock: MatchClock, matchID = MATCH) =>
    await addMinutesToMatch(clock, { matchID, minutes: 10 });

  it("a match storage does not have", async () => {
    const result = await refusalOf(clockOf([team()], storage({ missing: true })));

    expect(result).toStrictEqual({ status: "refused", matchID: MATCH, reason: { kind: "match-not-found" } });
  });

  it("a match whose team is gone", async () => {
    const result = await refusalOf(clockOf([], storage()));

    expect(result).toMatchObject({ status: "refused", reason: { kind: "team-not-found", teamId: TEAM_ID } });
  });

  it("a match with nobody on it", async () => {
    const result = await refusalOf(clockOf([team()], storage({ unnamed: true })));

    expect(result).toMatchObject({ status: "refused", reason: { kind: "team-not-found" } });
  });

  it("a team with no match running", async () => {
    const alpha = team({ relayMatch: { state: "NOT STARTED" } });

    const result = await refusalOf(clockOf([alpha], storage()));

    expect(result).toMatchObject({ status: "refused", reason: { kind: "no-match-running" } });
    expect(alpha.update).not.toHaveBeenCalled();
  });

  it("a match id the team has moved on from", async () => {
    const result = await refusalOf(clockOf([team()], storage()), "an-older-match");

    expect(result).toMatchObject({ status: "refused", reason: { kind: "other-match-running", running: MATCH } });
  });

  // The ordering the old handler had wrong: it moved the clock and wrote the
  // row, then looked the game up and threw a 404 on a match it had just changed.
  it("a game no registry has — before anything is written", async () => {
    const alpha = team();
    const db = storage({ gameName: "a-game-from-a-past-year" });

    const result = await refusalOf(clockOf([alpha], db));

    expect(result).toMatchObject({ status: "refused", reason: { kind: "game-not-found" } });
    expect(alpha.update).not.toHaveBeenCalled();
    expect(vi.mocked(db.setState)).not.toHaveBeenCalled();
  });
});

describe("a grant", () => {
  const GRANT = "a1b2c3d4";

  it("is recorded in the team's notes", async () => {
    const alpha = team();

    await addMinutesToMatch(clockOf([alpha], storage()), { matchID: MATCH, minutes: 10, grant: GRANT });

    expect(alpha.update).toHaveBeenCalledWith(expect.objectContaining({
      other: `Radnóti ${grantMarker(MATCH, GRANT)}:10`,
    }));
  });

  // What makes a repeat safe: the browser gives up on a request the server
  // finished, the organiser asks again, and the match must not move twice.
  it("asked for twice moves the clock once", async () => {
    const alpha = team({ other: `Radnóti ${grantMarker(MATCH, GRANT)}:10` });
    const db = storage();

    const result = await addMinutesToMatch(clockOf([alpha], db), { matchID: MATCH, minutes: 10, grant: GRANT });

    expect(result).toMatchObject({ status: "already-granted", matchID: MATCH });
    expect(alpha.update).not.toHaveBeenCalled();
    expect(vi.mocked(db.setState)).not.toHaveBeenCalled();
  });

  // A second, deliberate grant is a different one, and does apply.
  it("that is a different grant applies on top", async () => {
    const alpha = team({ other: `Radnóti ${grantMarker(MATCH, GRANT)}:10` });

    const result = await addMinutesToMatch(clockOf([alpha], storage()), {
      matchID: MATCH, minutes: 10, grant: "99887766",
    });

    expect(result).toMatchObject({ status: "extended" });
    expect(alpha.update).toHaveBeenCalledOnce();
  });

  // The same grant reaching a team's other match is a different match.
  it("names the match, so a team's other match is not taken for it", async () => {
    const alpha = team({ other: `${grantMarker("another-match", GRANT)}:10` });

    const result = await addMinutesToMatch(clockOf([alpha], storage()), { matchID: MATCH, minutes: 10, grant: GRANT });

    expect(result).toMatchObject({ status: "extended" });
  });
});
