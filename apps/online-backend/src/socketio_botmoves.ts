// The types below describe the socket.io this workspace declares. It must stay
// the same copy boardgame.io serves matches with through `koa-socket-2`: the
// root package.json's `overrides` block is what makes them one install, and
// socketio_transport.test.ts fails if they split (#461).
import type IOTypes from 'socket.io';
import type { Game, PlayerID, Server, State, StorageAPI } from "boardgame.io";
import type { Bot } from "boardgame.io/ai";
import { getFilterPlayerView, Sync as SyncStorage } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { GenericPubSub, SocketIO } from "boardgame.io/server";
import { isMakeMovePayloadReadOnly, currentPlayer, PlayerIDType } from "game";
import { getBotCredentials } from "./server/common";
import type { CorsOptionsDelegate } from "cors";

// boardgame.io does not export the types its own transport is written against.
// Naming them off what it does export keeps this file out of the package's
// build layout, which is not an API and can be rearranged by a patch release.
type MasterTransport = ConstructorParameters<typeof Master>[2];
type IntermediateTransportData = Parameters<MasterTransport['sendAll']>[0];
type TransportData = ReturnType<ReturnType<typeof getFilterPlayerView>>;
type SocketOpts = NonNullable<ConstructorParameters<typeof SocketIO>[0]>;

/** Copied from boardgame.io/dist/src/client/transport/local.ts */
function GetBotPlayer(state: State, bots: Record<PlayerID, Bot>) {
  if (state.ctx.gameover !== undefined) {
    return null;
  }

  if (state.ctx.activePlayers) {
    for (const key of Object.keys(bots)) {
      if (key in state.ctx.activePlayers) {
        return key;
      }
    }
  } else if (state.ctx.currentPlayer in bots) {
    return state.ctx.currentPlayer;
  }

  return null;
}

/** Copied from boardgame.io/dist/src/server/transport.ts. The `Type` enum the
 *  comparison needs is not exported, so the sync value is read off the `Sync`
 *  base class boardgame.io does export — a copy of the enum would be a second,
 *  unrelated one that only happens to share its numbers today (#328). */
export function isSynchronous(storageAPI: StorageAPI.Sync | StorageAPI.Async): storageAPI is StorageAPI.Sync {
  return storageAPI.type() === SyncStorage.prototype.type();
}

/** Used by TransportAPI. Copied from boardgame.io/dist/src/server/transport.ts */
const emit = (socket: IOTypes.Socket, { type, args }: TransportData) => {
  socket.emit(type, ...args);
};

/** Used by TransportAPI. Copied from boardgame.io/dist/src/server/transport.ts */
function getPubSubChannelId(matchID: string): string {
  return `MATCH-${matchID}`;
}

/** Copied from boardgame.io/dist/src/server/transport.ts */
export const TransportAPI = (
  matchID: string,
  // Null where the caller only needs sendAll and has no socket to send a
  // per-player message on — see the router's add-minutes handler.
  socket: IOTypes.Socket | null,
  filterPlayerView: ReturnType<typeof getFilterPlayerView>,
  pubSub: GenericPubSub<IntermediateTransportData>
): MasterTransport => {
  const send: MasterTransport['send'] = ({ playerID, ...data }) => {
    if (socket === null) {
      throw new Error("TransportAPI.send needs a socket; this one was built for sendAll only.");
    }
    emit(socket, filterPlayerView(playerID, data));
  };

  const sendAll: MasterTransport['sendAll'] = (payload) => {
    pubSub.publish(getPubSubChannelId(matchID), payload);
  };

  return { send, sendAll };
};

/** Copied from boardgame.io/dist/src/master/master.ts */
export async function fetch<T_Opts extends StorageAPI.FetchOpts>(
  db: StorageAPI.Async | StorageAPI.Sync,
  matchID: string,
  // Which fields come back depends on which ones were asked for, so callers
  // pass this `as const` — a widened `{ state: boolean }` names no field.
  partial: T_Opts
): Promise<StorageAPI.FetchResult<T_Opts>> {
  return isSynchronous(db)
    ? db.fetch(matchID, partial)
    : await db.fetch(matchID, partial);
}

/// Bot's playerID is '1', because the gameWrapper uses player '0' for the human player.
export const BOT_ID = PlayerIDType.JUDGE_PLAYER;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const LOGGED_ID_LENGTH = 64;

/** A client-supplied match id as a log can carry it: quoted, so a newline in it
 *  cannot start a line of its own, and cut short, so its length is not the
 *  client's to choose. */
export function describeMatchID(matchID: unknown): string {
  if (typeof matchID !== "string") {
    return `<${matchID === null ? "null" : typeof matchID}>`;
  }
  const quoted = JSON.stringify(matchID.slice(0, LOGGED_ID_LENGTH));
  return matchID.length > LOGGED_ID_LENGTH ? `${quoted}…` : quoted;
}

/** socket.io does not await a listener, and an unhandled rejection ends the
 *  process with every match on it. */
const logListenerFailure = (event: string, matchID: unknown) => (error: unknown) => {
  console.error(`Reacting to a ${event} for match ${describeMatchID(matchID)} failed:`, error);
};

/** Writes at most `limit` warnings per window, across every socket: a limit per
 *  socket alone is reset by opening another one. What it holds back is counted,
 *  and the count is written with the first warning of a later window. */
export class WarningBudget {
  private windowStart = -Infinity;
  private written = 0;
  private withheld = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  warn(line: string): void {
    const now = this.now();
    if (now - this.windowStart >= this.windowMs) {
      if (this.withheld > 0) {
        console.warn(`Withheld ${this.withheld} more such warnings`);
      }
      this.windowStart = now;
      this.written = 0;
      this.withheld = 0;
    }
    if (this.written < this.limit) {
      this.written++;
      console.warn(line);
    } else {
      this.withheld++;
    }
  }
}

/** This is a special transport specifically designed for replacing a player's move
 * with a bot's move.
 *
 * BOT_ID represents the player to replace.
 *
 * Modifying the server is also needed to fill the bot's slot in the lobby (see injectBots()).
 */
export class SocketIOButBotMoves extends SocketIO {
  bots: Record<string, Bot>;
  private readonly refusals = new WarningBudget(20, 60_000);
  constructor(
    socketOpts: SocketOpts,
    bots: Record<string, Bot>,
  ) {
    super({ ...socketOpts });
    this.bots = bots;
  }
  init(
    app: Server.App & { _io: IOTypes.Server; },
    games: Game[],
    origins?: Exclude<IOTypes.ServerOptions['cors'], undefined | CorsOptionsDelegate>['origin']
  ): void {
    super.init(app, games, origins);

    for (const game of games) {
      if (!game.name) {
        console.log(`There was a game with no name. This is the game object: ${JSON.stringify(game)}.\n We skipped the gameobject, you should fix this!".`)
        continue
      }
      const nsp = app._io?.of(game.name);
      const bot = this.bots[game.name];

      /** This should be in sync with how socket data is communicated.
       * See boardgame.io/dist/src/server/transport/socketio.ts
       */
      nsp.on("connection", (socket: IOTypes.Socket) => {
        /** Refuses a `sync` naming a match that storage does not have.
         *
         * boardgame.io's `Master.onSync` skips its credential check when
         * `playerID` is null — the spectator case it is written for — and
         * creates and persists a match when it finds none under the id it was
         * given. Between the two, anonymous socket traffic writes rows into
         * Postgres for as long as it cares to, none of which any team can
         * reach and nothing of which asks who is asking.
         *
         * A match here is only ever created by the server, for a team that
         * asked for one (`server/team_manage.ts`), and the id reaches a
         * browser only in that answer. So a sync for a match storage does not
         * have belongs to no client of this competition, and the packet never
         * reaches boardgame.io's listener.
         *
         * Only `sync`: boardgame.io answers an `update` or `chat` for an
         * unknown match without writing anything, and checking every move
         * here would cost it a storage read.
         *
         * A packet middleware rather than a wrapped listener: it is the hook
         * socket.io documents for this, and it does not depend on what the
         * base transport registered before us.
         */
        // Logged once per socket, so one socket cannot spend the whole budget.
        let reported = false;
        socket.use(([event, matchID]: IOTypes.Event, next) => {
          if (event !== "sync") {
            next();
            return;
          }
          const refuse = (reason: string) => {
            if (!reported) {
              reported = true;
              this.refusals.warn(`Refused a packet on socket ${socket.id}: ${reason}`);
            }
            next(new Error(reason));
          };
          if (typeof matchID !== "string" || matchID === "") {
            refuse("sync without a match id");
            return;
          }
          void fetch(app.context.db, matchID, { metadata: true } as const).then(
            ({ metadata }) => {
              if (metadata === undefined) {
                refuse(`sync for unknown match ${describeMatchID(matchID)}`);
                return;
              }
              next();
            },
            (error: unknown) => {
              // Not the client's doing, so not under the once-per-socket limit.
              console.error(`Storage could not be read for a sync of match ${describeMatchID(matchID)}:`, error);
              next(error instanceof Error ? error : new Error(String(error)));
            }
          );
        });

        socket.on("update", (...args: Parameters<Master['onUpdate']>) => {
          const matchID: unknown = args[2];
          void this.onPlayerUpdate(app.context, game, bot, args)
            .catch(logListenerFailure("update", matchID))
            .then(() => this.releaseUnjoinedQueue(matchID));
        });

        /* A player's move is the only other thing that asks the bot to play,
         * so a turn lost after the team's move was stored — a backend restart,
         * a database error — is one nobody would take, and the team cannot
         * move out of turn (#133). Every board syncs when its socket connects:
         * after a restart by itself, otherwise when the team reloads. So a
         * sync takes that turn.
         *
         * boardgame.io's own listener answers the sync from storage alongside
         * this one; the bot's think time is what puts its move after the board
         * has subscribed to the match. The board then gets the stored
         * state once more, for one that is behind rather than stuck: a reload
         * in the bot's think time can read storage before the bot's move is
         * stored and subscribe after it is published. Only a socket that
         * boardgame.io took as the match's client gets it, so a sync that
         * failed its credential check is sent nothing. */
        socket.on("sync", (matchID: string) => {
          void this.getMatchQueue(matchID).add(async () => {
            await this.playBotTurn(app.context, game, bot, matchID);
            const client = this.clientInfo.get(socket.id);
            if (client?.matchID !== matchID) {
              return;
            }
            const { state } = await fetch(app.context.db, matchID, { state: true } as const);
            emit(socket, getFilterPlayerView(game)(client.playerID, { type: "update", args: [matchID, state] }));
          }).catch(logListenerFailure("sync", matchID));
        });
      });
    }
  }

  /** Has the bot answer a player's move. The arguments are stale: boardgame.io's
   *  own listener has applied the move by the time the queue gets to this. The
   *  action is unchecked client input. */
  private async onPlayerUpdate(
    context: Pick<Server.AppCtx, "db" | "auth">,
    game: Game,
    bot: Bot,
    [actionData, , matchID, stalePlayerID]: Parameters<Master['onUpdate']>
  ): Promise<void> {
    // A key storage cannot read fails on every packet, and logListenerFailure
    // has no limit: past this check, a failure is storage's or the bot's, not
    // the client's.
    if (typeof matchID !== "string" || matchID === "") {
      return;
    }
    const action: unknown = actionData;
    if (!isRecord(action) || action.type !== "MAKE_MOVE") {
      return;
    }
    const payloadType: unknown = isRecord(action.payload) ? action.payload.type : undefined;
    if (typeof payloadType !== "string" || isMakeMovePayloadReadOnly(payloadType)) {
      return;
    }
    if (stalePlayerID === BOT_ID) {
      return;
    }
    // The player's move is already stored and pushed; the bot answers
    // in a push of its own, or the move and its reply land as one
    // update. See #346.
    await this.getMatchQueue(matchID).add(() => this.playBotTurn(context, game, bot, matchID));
  }

  /** Drops the queue an `update` made for a match no socket has joined.
   *
   *  boardgame.io's own `update` listener makes a queue for whatever match id
   *  the packet names, and deletes one only when the last client of a joined
   *  match leaves, so an id nobody syncs to keeps its queue for the life of
   *  the process — one per made-up id an anonymous client cares to send. Its
   *  listener registered first, so the queue exists by the time this runs.
   *
   *  Only an idle queue is dropped, and the next task for the match gets a new
   *  one: no two queues ever hold work for the same match at once. */
  private async releaseUnjoinedQueue(matchID: unknown): Promise<void> {
    // Keyed by whatever the client sent, not only by strings.
    const key = matchID as string;
    const queue = this.perMatchQueue.get(key);
    if (queue === undefined) {
      return;
    }
    await queue.onIdle();
    if (queue.size === 0 && queue.pending === 0 && !this.roomInfo.has(key) && this.perMatchQueue.get(key) === queue) {
      this.deleteMatchQueue(key);
    }
  }

  /** Plays the bot's turn if the match is waiting on one. Callers run it on
   *  the match's queue, so every move queued before it is stored by the time
   *  it reads.
   *
   *  Re-reads storage rather than taking a state from the caller: the `update`
   *  listener gets only the player's action, not the state boardgame.io's own
   *  listener produced, and `master.onUpdate` below reads storage again anyway.
   *
   *  No socket: `Master.onUpdate` only ever publishes to the match's channel. */
  private async playBotTurn(
    { db, auth }: Pick<Server.AppCtx, "db" | "auth">,
    game: Game,
    bot: Bot,
    matchID: string
  ): Promise<void> {
    const { state } = await fetch(db, matchID, { state: true } as const);
    if (state === undefined) {
      return;
    }
    if (currentPlayer(state.ctx) !== BOT_ID) {
      // Not a real action, possibly a failed move.
      return;
    }
    if (state.ctx.gameover) {
      return;
    }
    const botPlayer = GetBotPlayer(state, { [BOT_ID]: bot });
    if (botPlayer === null) {
      // Only reachable with ctx.gameover set to something falsy, which
      // the check above lets through and which no game here produces.
      return;
    }
    if (state.ctx.phase !== "play" && state.ctx.phase !== "startNewGame") {
      return;
    }
    const botAction = await bot.play(state, botPlayer);

    const master = new Master(
      game,
      db,
      TransportAPI(matchID, null, getFilterPlayerView(game), this.pubSub),
      auth
    );
    await master.onUpdate(
      {
        type: "MAKE_MOVE",
        payload: {
          ...botAction.action.payload,
          credentials: getBotCredentials(),
        },
      },
      state._stateID,
      matchID,
      BOT_ID
    );
  }
}
