import type { Server } from "boardgame.io";
import { SocketGuard } from "./socket_guard";

const MATCH = "match";
const SECRET = "team-secret";

const metadata = { players: { 0: { id: 0, credentials: SECRET }, 1: { id: 1, credentials: "bot" } } } as unknown as Server.MatchData;

/** A guard over one match, with the reads it makes on view. */
function guard(limits: ConstructorParameters<typeof SocketGuard>[1] = {}) {
  const lookUp = vi.fn(async (matchID: string) => (matchID === MATCH ? metadata : undefined));
  return { guard: new SocketGuard(lookUp, limits), lookUp };
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

  it("gives back the failure a proving packet was charged", async () => {
    const judge = guard({ failed: { limit: 1, windowMs: 60_000 } }).guard.forSocket("192.0.2.1");
    await judge(sync());
    expect((await judge(sync("guess", "a"))).pass).toBe(false);
    expect(await judge(sync("guess", "b"))).toEqual({ pass: false, disconnect: false, reason: "too many failed packets from this address" });
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
