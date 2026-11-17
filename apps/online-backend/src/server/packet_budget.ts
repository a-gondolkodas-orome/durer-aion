/** Fixed-window counters for what a socket client may send (#720), and the
 *  limits `socket_guard.ts` holds clients to with them. That file says what
 *  each limit is for; the numbers and their sizing are here. */

export interface PacketLimit {
  limit: number;
  windowMs: number;
}

/** Packets one socket may send, whoever it is.
 *
 * What a real board sends is far below it: a `sync` when it connects, a
 * `getTime` when the page loads, one `update` per move, which a person makes at
 * most a few times a second for a few seconds, and in the clock's last second
 * a `getTime` once a second (`Countdown.tsx`). The suite plays a whole match of
 * that against it. It has to sit that far above: a board the server
 * disconnects stays disconnected until the team reloads the page, since
 * socket.io does not reconnect after a disconnect the server made.
 */
export const SOCKET_PACKET_LIMIT: PacketLimit = { limit: 40, windowMs: 10_000 };

/** Packets one team may send over all its sockets together: a few tabs' worth
 *  of the socket limit, so a team reloading or with a second tab open never
 *  meets it, and one opening hundreds of sockets is held to this. */
export const TEAM_PACKET_LIMIT: PacketLimit = { limit: 200, windowMs: 10_000 };

/** Packets with credentials that do not check out, per address.
 *
 * Only failures are charged, as on `POST /team/join` (`rate_limit.ts`), which
 * is what makes a limit this low safe for a school behind one NAT address: its
 * boards always present a match's own credentials and spend none of it. What
 * fails is a client guessing, or a tab left open on a match that no longer
 * exists — a few packets, nowhere near twenty a minute.
 */
export const FAILED_PACKET_LIMIT: PacketLimit = { limit: 20, windowMs: 60_000 };

/** A fixed window: `limit` packets in every `windowMs` from the first packet of
 *  the window. */
export class PacketBudget {
  private windowStart = -Infinity;
  private spent = 0;

  constructor(private readonly budget: PacketLimit) {}

  /** Charges one packet; false once the window's packets are spent. */
  take(now = Date.now()): boolean {
    if (this.expired(now)) {
      this.windowStart = now;
      this.spent = 0;
    }
    this.spent += 1;
    return this.spent <= this.budget.limit;
  }

  /** Whether the window's packets are spent, without charging one. */
  spentOut(now = Date.now()): boolean {
    return !this.expired(now) && this.spent >= this.budget.limit;
  }

  /** Whether the window is over, so the budget is as good as a fresh one. */
  expired(now: number): boolean {
    return now - this.windowStart >= this.budget.windowMs;
  }
}

/** A `PacketBudget` per key. Synchronous, unlike `rate-limiter-flexible`'s
 *  limiters, so that a check never yields to a later packet of the socket.
 *
 *  A key whose window is over is forgotten, at most once a window, so a client
 *  that stopped sending does not stay in memory. */
export class KeyedPacketBudget {
  private readonly budgets = new Map<string, PacketBudget>();
  private lastSweep = -Infinity;

  constructor(private readonly budget: PacketLimit) {}

  take(key: string, now = Date.now()): boolean {
    if (now - this.lastSweep >= this.budget.windowMs) {
      this.lastSweep = now;
      for (const [stale, budget] of this.budgets) {
        if (budget.expired(now)) this.budgets.delete(stale);
      }
    }
    let budget = this.budgets.get(key);
    if (budget === undefined) {
      budget = new PacketBudget(this.budget);
      this.budgets.set(key, budget);
    }
    return budget.take(now);
  }

  spentOut(key: string, now = Date.now()): boolean {
    return this.budgets.get(key)?.spentOut(now) ?? false;
  }

  /** How many keys are held; for the suite. */
  get size(): number {
    return this.budgets.size;
  }
}
