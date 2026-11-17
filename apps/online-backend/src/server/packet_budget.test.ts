import type IOTypes from "socket.io";
import { KeyedPacketBudget, PacketBudget, SOCKET_PACKET_LIMIT, socketClientKey } from "./packet_budget";

describe("a socket's packet budget", () => {
  it("refuses the packet past the limit within one window", () => {
    const budget = new PacketBudget({ limit: 3, windowMs: 1_000 });
    expect([0, 10, 20, 30].map(now => budget.take(now))).toEqual([true, true, true, false]);
  });

  it("starts afresh once the window is over", () => {
    const budget = new PacketBudget({ limit: 1, windowMs: 1_000 });
    expect(budget.take(0)).toBe(true);
    expect(budget.take(999)).toBe(false);
    expect(budget.take(1_000)).toBe(true);
  });

  // What a board sends over a three-hour match, at its busiest: the connect
  // and load packets, a burst of moves made as fast as a person clicks every
  // ten seconds, and the clock's once-a-second poll for the whole of it — far
  // more polling than the last second's worth Countdown.tsx asks for.
  it("is not spent by a real client's traffic over a whole match", () => {
    const budget = new PacketBudget(SOCKET_PACKET_LIMIT);
    const sent: number[] = [0, 0];
    const matchMs = 3 * 60 * 60 * 1000;
    for (let second = 0; second * 1000 < matchMs; second++) {
      sent.push(second * 1000 + 500);
      if (second % 10 === 0) {
        for (let move = 0; move < 15; move++) sent.push(second * 1000 + move * 50);
      }
    }
    sent.sort((a, b) => a - b);

    expect(sent.filter(now => !budget.take(now))).toEqual([]);
  });

  it("stops a socket sending steadily within its first window", () => {
    const budget = new PacketBudget(SOCKET_PACKET_LIMIT);
    const refusedAt = Array.from({ length: SOCKET_PACKET_LIMIT.limit * 2 }, (_, i) => i).find(i => !budget.take(i));
    expect(refusedAt).toBe(SOCKET_PACKET_LIMIT.limit);
  });
});

describe("packet budgets kept per key", () => {
  it("charges each key its own budget", () => {
    const budgets = new KeyedPacketBudget({ limit: 1, windowMs: 1_000 });
    expect([budgets.take("a", 0), budgets.take("b", 0), budgets.take("a", 1)]).toEqual([true, true, false]);
  });

  it("forgets a key whose window is over", () => {
    const budgets = new KeyedPacketBudget({ limit: 1, windowMs: 1_000 });
    budgets.take("gone", 0);
    budgets.take("current", 1_500);
    expect(budgets.size).toBe(1);
  });
});

describe("the client a socket's packets are charged to", () => {
  const handshake = (address: string, forwardedFor?: string) =>
    ({ address, headers: forwardedFor === undefined ? {} : { "x-forwarded-for": forwardedFor } }) as unknown as IOTypes.Socket["handshake"];

  it("is nginx's X-Forwarded-For behind the proxy", () => {
    expect(socketClientKey(handshake("172.18.0.5", "203.0.113.7"), true)).toBe("203.0.113.7");
  });

  it("is the peer when the proxy is not trusted", () => {
    expect(socketClientKey(handshake("203.0.113.7", "198.51.100.1"), false)).toBe("203.0.113.7");
  });

  it("is the peer when no header came", () => {
    expect(socketClientKey(handshake("203.0.113.7"), true)).toBe("203.0.113.7");
  });

  it("is an IPv6 subscriber's prefix, as the join limit counts it", () => {
    expect(socketClientKey(handshake("::1", "2001:db8:0:1::1"), true))
      .toBe(socketClientKey(handshake("::1", "2001:db8:0:2::9"), true));
  });
});
