import type { Server } from "boardgame.io";
import { SocketGuard, type GuardStorage } from "./socket_guard";

const MATCH = "match";
const SECRET = "team-secret";

const metadata = { players: { 0: { id: 0, credentials: SECRET }, 1: { id: 1, credentials: "bot" } } } as unknown as Server.MatchData;

/** A guard over one match, with the reads it makes on view. `authenticate`
 *  is boardgame.io's default rule, as the server configures it. */
function guard(limits: ConstructorParameters<typeof SocketGuard>[1] = {}) {
  const lookUp = vi.fn(async (matchID: string) => (matchID === MATCH ? metadata : undefined));
  const authenticate = vi.fn(({ playerID, credentials, metadata: { players } }: Parameters<GuardStorage["authenticate"]>[0]) =>
    (players as Record<string, { credentials?: string } | undefined>)[playerID]?.credentials === credentials);
  return { guard: new SocketGuard({ lookUp, authenticate }, limits), lookUp, authenticate };
}

const sync = (credentials: unknown = SECRET, matchID: unknown = MATCH) => ["sync", matchID, "0", credentials, 2];
const update = (credentials: unknown = SECRET) =>
  ["update", { type: "MAKE_MOVE", payload: { type: "noop", args: [], credentials } }, 0, MATCH, "0"];

describe("the socket guard", () => {
  it("lets a match's player through, and nobody else", async () => {
    const judge = guard().guard.forSocket("192.0.2.1");
    expect(await judge(sync())).toEqual({ pass: true });
    expect((await judge(sync("guess"))).pass).toBe(false);
    expect((await judge(sync(SECRET, "other"))).pass).toBe(false);
    expect((await judge(["sync", MATCH, null, undefined, 2])).pass).toBe(false);
    expect((await judge(update("guess"))).pass).toBe(false);
  });

  // The bot's credentials are server-side; a client naming the bot's seat
  // with the team's credentials is still not the bot.
  it("checks the credentials of the seat the packet names", async () => {
    const judge = guard().guard.forSocket("192.0.2.1");
    expect((await judge(["sync", MATCH, "1", SECRET, 2])).pass).toBe(false);
  });

  it("reads storage for a proved player's sync, and not for its moves", async () => {
    const { guard: g, lookUp } = guard();
    const judge = g.forSocket("192.0.2.1");
    await judge(sync());
    await judge(update());
    await judge(update());
    await judge(sync());
    expect(lookUp).toHaveBeenCalledTimes(2);
  });

  it("passes what boardgame.io does not read, and refuses every chat", async () => {
    const judge = guard().guard.forSocket("192.0.2.1");
    expect(await judge(["unknown"])).toEqual({ pass: true });
    expect((await judge(["chat", MATCH, {}, SECRET])).pass).toBe(false);
  });

  // A board that waits on a read must not count as a failure meanwhile: after
  // a restart every board at a school proves itself at once.
  it("charges an address only for failures it has read", async () => {
    let release: () => void = () => undefined;
    const { guard: g, lookUp } = guard({ failed: { limit: 1, windowMs: 60_000 } });
    const held = new Promise<void>(resolve => { release = resolve; });
    lookUp.mockImplementation(async (matchID: string) => { await held; return matchID === MATCH ? metadata : undefined; });
    const boards = Array.from({ length: 5 }, () => g.forSocket("192.0.2.1")(sync()));
    release();

    expect(await Promise.all(boards)).toEqual(Array(5).fill({ pass: true }));
  });

  // A school's own board can be the one turned away; dropped silently, its
  // moves would show as played.
  it("disconnects a socket its address's failures turn away, without reading", async () => {
    const { guard: g, lookUp } = guard({ failed: { limit: 1, windowMs: 60_000 } });
    const judge = g.forSocket("192.0.2.1");
    expect(await judge(sync("guess"))).toEqual({ pass: false, disconnect: false, reason: `sync not from a player of match ${MATCH}` });
    lookUp.mockClear();

    expect(await g.forSocket("192.0.2.1")(sync())).toEqual({ pass: false, disconnect: true });
    expect(await g.forSocket("198.51.100.1")(sync())).toEqual({ pass: true });
    expect(lookUp).toHaveBeenCalledTimes(1);
  });

  it("keeps serving a proved player at an address that is locked out", async () => {
    const { guard: g } = guard({ failed: { limit: 1, windowMs: 60_000 } });
    await g.forSocket("192.0.2.1")(sync());
    await g.forSocket("192.0.2.1")(sync("guess"));
    expect(await g.forSocket("192.0.2.1")(sync())).toEqual({ pass: true });
  });

  // boardgame.io looks a seat up by the id as sent, so "00" is no seat.
  it.each(["00", "", " 0"])("refuses the seat id %j, which only reads as a number like 0", async (playerID) => {
    const judge = guard().guard.forSocket("192.0.2.1");
    expect((await judge(["sync", MATCH, playerID, SECRET, 2])).pass).toBe(false);
  });

  it("asks the configured credential check, and refuses a seat without credentials whatever it says", async () => {
    const { guard: g, lookUp, authenticate } = guard();
    const judge = g.forSocket("192.0.2.1");
    authenticate.mockReturnValueOnce(false);
    expect((await judge(sync())).pass).toBe(false);

    const seatless = { players: { 0: { id: 0 }, 1: { id: 1, credentials: "bot" } } } as unknown as Server.MatchData;
    lookUp.mockResolvedValueOnce(seatless);
    authenticate.mockReturnValue(true);
    expect((await judge(sync())).pass).toBe(false);
  });

  it("forgets a proved player whose match is gone", async () => {
    const { guard: g, lookUp } = guard();
    const judge = g.forSocket("192.0.2.1");
    await judge(sync());
    lookUp.mockResolvedValue(undefined);
    expect((await judge(sync())).pass).toBe(false);
    lookUp.mockResolvedValue(metadata);
    await judge(update());
    expect(lookUp).toHaveBeenCalledTimes(3);
  });

  // socket.io dispatches a packet as soon as its middleware is done, so one
  // waiting on a read must hold back the move behind it.
  it("answers a socket's packets in the order they came", async () => {
    let release: () => void = () => undefined;
    const { guard: g, lookUp } = guard();
    lookUp.mockImplementationOnce(() => new Promise(resolve => { release = () => { resolve(metadata); }; }));
    const judge = g.forSocket("192.0.2.1");
    const order: string[] = [];
    const first = judge(sync()).then(() => order.push("sync"));
    const second = judge(["unknown"]).then(() => order.push("unknown"));
    await new Promise(resolve => setImmediate(resolve));
    release();
    await Promise.all([first, second]);
    expect(order).toEqual(["sync", "unknown"]);
  });

  it("disconnects a socket over its budget without judging the packet", async () => {
    const { guard: g, lookUp } = guard({ socket: { limit: 1, windowMs: 60_000 } });
    const judge = g.forSocket("192.0.2.1");
    await judge(["unknown"]);
    expect(await judge(sync())).toEqual({ pass: false, disconnect: true });
    expect(lookUp).not.toHaveBeenCalled();
  });
});
