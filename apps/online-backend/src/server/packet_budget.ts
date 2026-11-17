/** How many socket.io packets one socket may send (#720).
 *
 * Every `sync` reads Postgres before anything asks who is sending it, and every
 * `update` reads it again for the bot — on the one connection pool that the
 * teams' moves and the bot's replies wait on (`getDb()`). Without a ceiling, one
 * client sending steadily keeps that pool busy and every live match waits behind
 * it. The budget is per socket, so it is spent before the packet middleware
 * reaches storage; nginx's per-address `limit_conn` on `/socket.io/`
 * (`apps/online-frontend/nginx/nginx.conf`) is what bounds how many sockets one
 * client gets to spend it on.
 *
 * What a real board sends is far below it: a `sync` when it connects, a
 * `getTime` when the page loads, one `update` per move, which a person makes at
 * most a few times a second for a few seconds, and in the clock's last second
 * a `getTime` once a second (`Countdown.tsx`). The suite plays a whole match of
 * that against it.
 */
export const PACKET_LIMIT = 40;
export const PACKET_WINDOW_MS = 10_000;

/** A fixed window: a socket gets `limit` packets in every `windowMs` from the
 *  first packet of the window. One per socket, so it goes with the socket. */
export class PacketBudget {
  private windowStart = -Infinity;
  private spent = 0;

  constructor(
    private readonly limit = PACKET_LIMIT,
    private readonly windowMs = PACKET_WINDOW_MS,
  ) {}

  /** Charges one packet; false once the window's packets are spent. */
  take(now = Date.now()): boolean {
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.spent = 0;
    }
    this.spent += 1;
    return this.spent <= this.limit;
  }
}
