import { PACKET_LIMIT, PacketBudget } from "./packet_budget";

describe("a socket's packet budget", () => {
  it("refuses the packet past the limit within one window", () => {
    const budget = new PacketBudget(3, 1_000);
    expect([0, 10, 20, 30].map(now => budget.take(now))).toEqual([true, true, true, false]);
  });

  it("starts afresh once the window is over", () => {
    const budget = new PacketBudget(1, 1_000);
    expect(budget.take(0)).toBe(true);
    expect(budget.take(999)).toBe(false);
    expect(budget.take(1_000)).toBe(true);
  });

  // What a board sends over a three-hour match, at its busiest: the connect
  // and load packets, a burst of moves made as fast as a person clicks every
  // ten seconds, and the clock's once-a-second poll for the whole of it — far
  // more polling than the last second's worth Countdown.tsx asks for.
  it("is not spent by a real client's traffic over a whole match", () => {
    const budget = new PacketBudget();
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
    const budget = new PacketBudget();
    const refusedAt = Array.from({ length: PACKET_LIMIT * 2 }, (_, i) => i).find(i => !budget.take(i));
    expect(refusedAt).toBe(PACKET_LIMIT);
  });
});
