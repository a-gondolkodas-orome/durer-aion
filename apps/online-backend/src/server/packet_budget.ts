import type IOTypes from 'socket.io';
import { clientKey } from './rate_limit';

/** How many socket.io packets a client may send (#720).
 *
 * Every `sync` reads Postgres before anything asks who is sending it, and every
 * `update` reads it again for the bot — on the one connection pool that the
 * teams' moves and the bot's replies wait on (`getDb()`). Without a ceiling, one
 * client sending steadily keeps that pool busy and every live match waits behind
 * it. Both budgets are spent before the packet middleware reaches storage, and a
 * socket over either is disconnected.
 *
 * The one that bounds a client is the address's: a socket costs nothing to open
 * and reads nothing when it connects, so a budget of the socket's own would be
 * refilled by reconnecting, or multiplied by opening more — nginx lets one
 * address hold hundreds (`limit_conn` in `nginx.conf`). The address is
 * `clientKey`'s, the one the join limit counts, so an IPv6 subscriber's whole
 * prefix is one client.
 *
 * One address is a whole school behind its NAT, which is what the address
 * budget is sized for. Someone flooding from inside a school spends that
 * school's budget and stalls that school's boards, and nobody else's. The
 * socket's budget is the tighter second limit, so that one runaway tab is cut
 * off before it eats into the rest of its school's.
 *
 * What a real board sends is far below both: a `sync` when it connects, a
 * `getTime` when the page loads, one `update` per move, which a person makes at
 * most a few times a second for a few seconds, and in the clock's last second
 * a `getTime` once a second (`Countdown.tsx`). The suite plays a whole match of
 * that against the socket's budget. They have to sit that far above it: a
 * board the server disconnects stays disconnected until the team reloads the
 * page, since socket.io does not reconnect after a disconnect the server made.
 */
export interface PacketLimit {
  limit: number;
  windowMs: number;
}

export const SOCKET_PACKET_LIMIT: PacketLimit = { limit: 40, windowMs: 10_000 };

/** Fifty teams, each with a couple of boards at the socket budget's busiest
 *  real traffic, fit with room to spare; a client flooding from one address
 *  gets a hundred reads a second, which a pool of twenty serves alongside the
 *  live matches. */
export const ADDRESS_PACKET_LIMIT: PacketLimit = { limit: 1_000, windowMs: 10_000 };

/** A fixed window: `limit` packets in every `windowMs` from the first packet of
 *  the window. */
export class PacketBudget {
  private windowStart = -Infinity;
  private spent = 0;

  constructor(private readonly budget: PacketLimit = SOCKET_PACKET_LIMIT) {}

  /** Charges one packet; false once the window's packets are spent. */
  take(now = Date.now()): boolean {
    if (this.expired(now)) {
      this.windowStart = now;
      this.spent = 0;
    }
    this.spent += 1;
    return this.spent <= this.budget.limit;
  }

  /** Whether the window is over, so the budget is as good as a fresh one. */
  expired(now: number): boolean {
    return now - this.windowStart >= this.budget.windowMs;
  }
}

/** A `PacketBudget` per key. Synchronous, unlike `rate-limiter-flexible`'s
 *  limiters: socket.io dispatches a packet when its middleware calls `next`,
 *  so an awaited check could let a later packet of the socket overtake it.
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

  /** How many keys are held; for the suite. */
  get size(): number {
    return this.budgets.size;
  }
}

/** The client a socket's packets are charged to: the address koa's `ctx.ip`
 *  would report for the request that opened it, through `clientKey`.
 *
 *  With `proxy` — `app.proxy`, set in `server.ts` — that is the first
 *  `X-Forwarded-For` entry, which nginx overwrites with the address that
 *  connected to it (`nginx.conf`); without it, the peer's own address. */
export function socketClientKey(handshake: IOTypes.Socket["handshake"], proxy: boolean): string {
  const forwarded = handshake.headers['x-forwarded-for'];
  const first = proxy && typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return clientKey(first || handshake.address);
}
