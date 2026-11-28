// The types below describe the socket.io this workspace declares. It must stay
// the same copy boardgame.io serves matches with through `koa-socket-2`: the
// root package.json's `overrides` block is what makes them one install, and
// socketio_transport.test.ts fails if they split (#461).
import type IOTypes from 'socket.io';
import type { Game, Server, State, StorageAPI } from "boardgame.io";
import { getFilterPlayerView, Sync as SyncStorage } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { GenericPubSub, SocketIO } from "boardgame.io/server";
import { isMakeMovePayloadReadOnly, currentPlayer, PHASE, PlayerIDType, STRATEGY_BUDGET_MS } from "game";
import { getBotCredentials } from "./server/common";
import { SocketGuard, socketClientKey, type GuardLimits } from "./server/socket_guard";
import type { BotPlayMetadata, MatchBot } from "game";
import type { CorsOptionsDelegate } from "cors";

// boardgame.io does not export the types its own transport is written against.
// Naming them off what it does export keeps this file out of the package's
// build layout, which is not an API and can be rearranged by a patch release.
type MasterTransport = ConstructorParameters<typeof Master>[2];
type IntermediateTransportData = Parameters<MasterTransport['sendAll']>[0];
type TransportData = ReturnType<ReturnType<typeof getFilterPlayerView>>;
type SocketOpts = NonNullable<ConstructorParameters<typeof SocketIO>[0]>;

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
  // per-player message on: the bot's turn.
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

/** socket.io does not await a listener, and an unhandled rejection ends the
 *  process with every match on it. */
const logListenerFailure = (event: string, matchID: string) => (error: unknown) => {
  console.error(`Reacting to a ${event} for match ${JSON.stringify(matchID)} failed:`, error);
};

/** This is a special transport specifically designed for replacing a player's move
 * with a bot's move.
 *
 * BOT_ID represents the player to replace.
 *
 * Modifying the server is also needed to fill the bot's slot in the lobby (see injectBots()).
 */
export class SocketIOButBotMoves extends SocketIO {
  bots: Record<string, MatchBot>;
  // The suite's way to reach a limit in a few packets.
  private readonly guardLimits: GuardLimits;
  private readonly botFailure: BotFailureMode;
  constructor(
    socketOpts: SocketOpts,
    bots: Record<string, MatchBot>,
    guardLimits: GuardLimits = {},
    botFailure: BotFailureMode = "recover",
  ) {
    super({ ...socketOpts });
    this.bots = bots;
    this.guardLimits = guardLimits;
    this.botFailure = botFailure;
  }
  init(
    app: Server.App & { _io: IOTypes.Server; },
    games: Game[],
    origins?: Exclude<IOTypes.ServerOptions['cors'], undefined | CorsOptionsDelegate>['origin']
  ): void {
    super.init(app, games, origins);
    // One for every namespace: a team's sockets to either game share its
    // budget, and an address's failures count across both.
    const guard = new SocketGuard({
      lookUp: async matchID => (await fetch(app.context.db, matchID, { metadata: true } as const)).metadata,
      authenticate: claim => app.context.auth.authenticateCredentials(claim),
    }, this.guardLimits);

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
        /** Lets a packet through to boardgame.io only as `socket_guard.ts`
         * decides. A packet middleware rather than a wrapped listener: it is
         * the hook socket.io documents for this, and it does not depend on
         * what the base transport registered before us. */
        // Read when the socket connects, by when server.ts has set app.proxy.
        const judge = guard.forSocket(socketClientKey(socket.handshake, app.proxy));
        socket.use((packet: IOTypes.Event, next) => {
          judge(packet).then(
            verdict => {
              if (verdict.pass) {
                next();
              } else if (verdict.disconnect) {
                // Frees the connection nginx counts against the address too.
                socket.disconnect(true);
              } else {
                next(new Error(verdict.reason));
              }
            },
            (error: unknown) => { next(error instanceof Error ? error : new Error(String(error))); }
          );
        });

        socket.on("update", (...args: Parameters<Master['onUpdate']>) => {
          const matchID = args[2];
          void this.onPlayerUpdate(app.context, game, bot, args)
            .catch(logListenerFailure("update", matchID));
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

  /** Sends every board of the match a state written outside a move, as
   *  `Master` sends one after a move. */
  publishUpdate(matchID: string, state: State): void {
    // What `TransportAPI(...).sendAll` does; each board's view is filtered by
    // the channel's subscriber, which boardgame.io set up for the match's game.
    this.pubSub.publish(getPubSubChannelId(matchID), { type: "update", args: [matchID, state] });
  }

  /** Has the bot answer a player's move. The arguments are stale: boardgame.io's
   *  own listener has applied the move by the time the queue gets to this. */
  private async onPlayerUpdate(
    context: Pick<Server.AppCtx, "db" | "auth">,
    game: Game,
    bot: MatchBot,
    [actionData, , matchID, stalePlayerID]: Parameters<Master['onUpdate']>
  ): Promise<void> {
    // Typed as boardgame.io's action, but it is whatever the client sent.
    if (actionData?.type !== "MAKE_MOVE" || isMakeMovePayloadReadOnly(actionData.payload?.type)) {
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
    bot: MatchBot,
    matchID: string
  ): Promise<void> {
    // The metadata too: the relay's judge reads its problems from the setup data.
    const { state, metadata } = await fetch(db, matchID, { state: true, metadata: true } as const);
    // Not a real action, possibly a failed move.
    if (state === undefined || !isBotsTurn(state)) {
      return;
    }
    const master = new Master(
      game,
      db,
      TransportAPI(matchID, null, getFilterPlayerView(game), this.pubSub),
      auth
    );

    /** Sends one of the bot's moves and reads back what it left; the state
     *  ID alone says whether the game took it, which holds because every
     *  write of a match runs on its queue, and this whole turn is one job on
     *  it. A write from outside the queue that landed in the bot's pause
     *  would look exactly like its move (#655). */
    const send = async (from: State, payload: BotMove): Promise<{ state: State, taken: boolean } | undefined> => {
      await master.onUpdate(
        { type: "MAKE_MOVE", payload: { type: payload.type, args: payload.args ?? [], playerID: BOT_ID, credentials: getBotCredentials() } },
        from._stateID,
        matchID,
        BOT_ID
      );
      const { state: after } = await fetch(db, matchID, { state: true } as const);
      return after === undefined ? undefined : { state: after, taken: after._stateID !== from._stateID };
    };
    const name = JSON.stringify(matchID);

    // The bot's whole turn, each move stored and pushed on its own, as long as
    // the turn is the bot's: a turn of several moves, and a bot that plays two
    // turns running, the opening position and then the first move.
    let current = state;
    for (let moves = 0; isBotsTurn(current); moves++) {
      // A strategy that keeps naming moves that keep the turn would loop for
      // ever, and the match's queue with it.
      if (moves === MAX_BOT_MOVES) {
        console.error(`The bot of match ${name} still had the turn after ${moves} moves.`);
        return;
      }
      // Only the strategy's own failure is the bot's: a storage error below
      // still rejects the job, as any other does.
      const answer = await bot.play(current, BOT_ID, metadata?.setupData)
        .then(played => ({ played }), (error: unknown) => ({ error }));
      let failure: string;
      if ("error" in answer) {
        failure = `threw ${answer.error instanceof Error ? answer.error.message : String(answer.error)}`;
      } else {
        const { action, metadata: timing } = answer.played;
        const { strategyMs } = (timing ?? {}) as Partial<BotPlayMetadata>;
        if (strategyMs !== undefined && strategyMs > STRATEGY_BUDGET_MS) {
          console.warn(`The bot of match ${name} took ${strategyMs} ms to name a move, over its ${STRATEGY_BUDGET_MS} ms.`);
        }
        const { type, args } = action.payload;
        const result = await send(current, { type, args });
        if (result === undefined) return;
        if (result.taken) {
          current = result.state;
          continue;
        }
        failure = `named ${describeMove({ type, args })}, which the game refused`;
      }

      // docs/ARCHITECTURE.md says what the two modes are for.
      const instead = this.botFailure === "recover" && current.ctx.phase === PHASE.play
        ? randomLegalMove(game, current)
        : undefined;
      if (instead !== undefined) {
        const noted = await send(current, noteMove(failure, false));
        if (noted === undefined) return;
        current = noted.state;
        const result = await send(current, instead);
        if (result === undefined) return;
        if (result.taken) {
          console.warn(`The bot of match ${name} ${failure}; it played ${describeMove(instead)} instead.`);
          current = result.state;
          continue;
        }
        failure += `, and the game refused ${describeMove(instead)} too`;
      }
      console.error(`The bot of match ${name} ${failure}; the match waits on the bot.`);
      await send(current, noteMove(failure, true));
      return;
    }
  }
}

/** What the server does when the bot's strategy fails: plays a random legal
 *  move in its place, or waits for an organiser. `BOT_FAILURE` in the
 *  environment; docs/ARCHITECTURE.md says what each is for. */
export type BotFailureMode = "recover" | "stall";

/** Unset or empty is `recover`, so a competition that forgot the setting
 *  keeps its teams playing. Anything else stops the server at start. */
export function botFailureMode(value: string | undefined): BotFailureMode {
  if (value === undefined || value === "" || value === "recover") return "recover";
  if (value === "stall") return "stall";
  throw new Error(`BOT_FAILURE is ${JSON.stringify(value)}; it must be "recover" or "stall", or unset.`);
}

/** A move as the bot sends it, before the server signs it. */
interface BotMove {
  type: string;
  args?: unknown[];
}

const describeMove = ({ type, args }: BotMove) => `${type}(${JSON.stringify(args ?? [])})`;

const noteMove = (reason: string, stuck: boolean): BotMove => ({ type: "noteBotFailure", args: [reason, stuck] });

/** One of the moves the game lists for the bot, at random; none if it lists
 *  none. `possibleMoves` is exact for the state, also halfway through a turn
 *  (types.ts), and is the only thing the server knows to be legal. */
function randomLegalMove(game: Game, state: State): BotMove | undefined {
  const moves = (game.ai?.enumerate(state.G, state.ctx, BOT_ID) ?? [])
    .flatMap(entry => "move" in entry ? [{ type: entry.move, args: entry.args }] : []);
  return moves.length === 0 ? undefined : moves[Math.floor(Math.random() * moves.length)];
}

/** How many moves one bot job may play. Generous: a turn of the games here is
 *  at most two moves, and a job plays at most two turns. */
const MAX_BOT_MOVES = 20;

/** Whether the match waits on the bot, in a phase the bot plays in. */
function isBotsTurn(state: State): boolean {
  return !state.ctx.gameover && currentPlayer(state.ctx) === BOT_ID
    && (state.ctx.phase === PHASE.play || state.ctx.phase === PHASE.startNewGame);
}
