import type { Server } from 'boardgame.io';
import type IOTypes from 'socket.io';
import { clientKey } from './rate_limit';
import {
  FAILED_PACKET_LIMIT, KeyedPacketBudget, PacketBudget, SOCKET_PACKET_LIMIT, TEAM_PACKET_LIMIT, type PacketLimit,
} from './packet_budget';

/** What the socket transport lets through to boardgame.io (#695, #720).
 *
 * Every `sync` and `update` costs boardgame.io a Postgres read, on the one pool
 * that every team's moves and the bot's replies wait on (`getDb()`), and
 * boardgame.io reads before it asks who is sending: its `onSync` skips the
 * credential check when `playerID` is null and creates and stores a match when
 * it finds none, and its socket transport keeps a queue for every match id an
 * `update` names. So a packet reaches it only once it is known to come from the
 * player it claims to be.
 *
 * - Both packets carry the player's credentials — a `sync` as an argument, an
 *   `update` in its action's payload — and a packet whose credentials do not
 *   pass boardgame.io's own check against its match is refused. An `update`
 *   has to prove itself too, not ride on a `sync` before it: socket.io sends
 *   the moves it buffered while disconnected *before* the `sync` that
 *   reconnecting sends.
 * - A player that has proved itself is remembered, so its moves cost no read
 *   of ours on top of boardgame.io's. A `sync` is looked up every time: they
 *   are rare, and a match can be wiped (the loser of a start race, `router.ts`)
 *   while boardgame.io would recreate it on a sync.
 * - Failures are counted per address and only failures, as `POST /team/join`
 *   counts wrong codes, and only once a read has shown them to be failures:
 *   a school's boards proving themselves all at once — after a backend
 *   restart, which forgets who has proved itself — spend none of it. Past the
 *   limit, a packet that would need a read is not given one. Packets read
 *   while the limit was being reached can pass it by as many as are in flight
 *   at once, which is one per socket.
 * - What a proved player sends is counted per team, over all its sockets, so a
 *   team flooding spends its own allowance and cuts off only its own boards.
 * - What any socket sends is counted per socket, before anything else, so a
 *   runaway tab is cut off before it eats into its team's.
 *
 * A socket over its own or its team's budget is disconnected, and so is one
 * turned away unread because its address is locked out: that can be a school's
 * own board, beside someone guessing, and a board whose moves were dropped while
 * it stayed connected would show them as played. Disconnected, it shows the
 * connection lost. A packet whose credentials were read and failed is refused
 * and the socket kept. Every `chat` is refused: no client of ours sends one,
 * and boardgame.io's listener reads storage for it without awaiting.
 */

export type Verdict =
  | { pass: true }
  | { pass: false, disconnect: false, reason: string }
  | { pass: false, disconnect: true };

type Metadata = Server.MatchData | undefined;

/** What the guard reads with: the match's metadata, and boardgame.io's
 *  configured credential check (`app.context.auth`), so the two cannot
 *  disagree about who a player is. */
export interface GuardStorage {
  lookUp(matchID: string): Promise<Metadata>;
  authenticate(claim: { playerID: string, credentials: string, metadata: Server.MatchData }): boolean | Promise<boolean>;
}

export interface GuardLimits {
  socket?: PacketLimit;
  team?: PacketLimit;
  failed?: PacketLimit;
}

interface Claim {
  event: 'sync' | 'update';
  matchID: string;
  playerID: string;
  credentials: string;
}

const PASS: Verdict = { pass: true };
const DISCONNECT: Verdict = { pass: false, disconnect: true };
const refuse = (reason: string): Verdict => ({ pass: false, disconnect: false, reason });

/** Who a `sync` or `update` says it is from, or why it does not say.
 *  `sync(matchID, playerID, credentials, numPlayers)` and
 *  `update(action, stateID, matchID, playerID)` are boardgame.io's client's. */
function claimOf(event: 'sync' | 'update', args: unknown[]): Claim | string {
  const [matchID, playerID, credentials] = event === 'sync'
    ? [args[0], args[1], args[2]]
    : [args[2], args[3], (args[0] as { payload?: { credentials?: unknown } } | null | undefined)?.payload?.credentials];
  // Postgres rejects a key that is not a string, and boardgame.io leaves that
  // unhandled (#695).
  if (typeof matchID !== 'string' || matchID === '') return `${event} without a match id`;
  if (typeof playerID !== 'string' || typeof credentials !== 'string' || credentials === '') {
    return `${event} without a player's credentials`;
  }
  return { event, matchID, playerID, credentials };
}

export class SocketGuard {
  /** Claims that passed: bounded by the players of real matches. */
  private readonly proved = new Set<string>();
  private readonly socketLimit: PacketLimit;
  private readonly teams: KeyedPacketBudget;
  private readonly failures: KeyedPacketBudget;

  constructor(
    private readonly storage: GuardStorage,
    { socket = SOCKET_PACKET_LIMIT, team = TEAM_PACKET_LIMIT, failed = FAILED_PACKET_LIMIT }: GuardLimits = {},
  ) {
    this.socketLimit = socket;
    this.teams = new KeyedPacketBudget(team);
    this.failures = new KeyedPacketBudget(failed);
  }

  /** The judge for one socket's packets, charged to `address` when they fail.
   *
   *  Verdicts resolve in the order the packets came: socket.io dispatches a
   *  packet when its middleware calls `next`, so a packet waiting on a read
   *  would otherwise be overtaken by the move after it. */
  forSocket(address: string): (packet: unknown[]) => Promise<Verdict> {
    const budget = new PacketBudget(this.socketLimit);
    let previous: Promise<unknown> = Promise.resolve();
    return (packet) => {
      if (!budget.take()) return Promise.resolve(DISCONNECT);
      const verdict = previous.then(() => this.judge(packet, address));
      previous = verdict.catch(() => undefined);
      return verdict;
    };
  }

  /** boardgame.io's check, and that the seat has credentials at all: its
   *  default `Auth` passes anyone in a match none of whose seats has any, and
   *  every match a team plays gets the team's when it is created
   *  (`router.ts`). The seat is looked up by the id as sent, as boardgame.io
   *  looks it up. */
  private async isAuthentic(metadata: Metadata, { playerID, credentials }: Claim): Promise<boolean> {
    if (metadata === undefined) return false;
    const seat = (metadata.players as Record<string, { credentials?: unknown } | undefined>)[playerID];
    if (typeof seat?.credentials !== 'string' || seat.credentials === '') return false;
    return await this.storage.authenticate({ playerID, credentials, metadata });
  }

  private async judge([event, ...args]: unknown[], address: string): Promise<Verdict> {
    if (event === 'chat') return refuse('chat is not used');
    if (event !== 'sync' && event !== 'update') return PASS;
    const claim = claimOf(event, args);
    if (typeof claim === 'string') return refuse(claim);

    const key = JSON.stringify([claim.matchID, claim.playerID, claim.credentials]);
    const known = this.proved.has(key);
    if (known && event === 'update') return this.chargeTeam(claim);

    if (!known && this.failures.spentOut(address)) return DISCONNECT;
    if (!(await this.isAuthentic(await this.storage.lookUp(claim.matchID), claim))) {
      if (known) this.proved.delete(key);
      else this.failures.take(address);
      return refuse(`${event} not from a player of match ${claim.matchID}`);
    }
    this.proved.add(key);
    return this.chargeTeam(claim);
  }

  private chargeTeam({ credentials }: Claim): Verdict {
    return this.teams.take(credentials) ? PASS : DISCONNECT;
  }
}

/** The client a socket's failures are charged to: the address koa's `ctx.ip`
 *  would report for the request that opened it, through `clientKey`, so that
 *  this and the join limit count the same client.
 *
 *  With `proxy` — `app.proxy`, set in `server.ts` — that is the first
 *  `X-Forwarded-For` entry, which nginx overwrites with the address that
 *  connected to it (`nginx.conf`); without it, the peer's own address. */
export function socketClientKey(handshake: IOTypes.Socket["handshake"], proxy: boolean): string {
  const forwarded = handshake.headers['x-forwarded-for'];
  const first = proxy && typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return clientKey(first || handshake.address);
}
