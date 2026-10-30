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

/** This is a special transport specifically designed for replacing a player's move
 * with a bot's move.
 *
 * BOT_ID represents the player to replace.
 *
 * Modifying the server is also needed to fill the bot's slot in the lobby (see injectBots()).
 */
export class SocketIOButBotMoves extends SocketIO {
  bots: Record<string, Bot>;
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
         * A packet middleware rather than a wrapped listener: it is the hook
         * socket.io documents for this, and it does not depend on what the
         * base transport registered before us.
         */
        socket.use(([event, matchID]: IOTypes.Event, next) => {
          if (event !== "sync") {
            next();
            return;
          }
          if (typeof matchID !== "string" || matchID === "") {
            next(new Error("sync without a match id"));
            return;
          }
          void fetch(app.context.db, matchID, { metadata: true } as const).then(
            ({ metadata }) => {
              next(metadata === undefined ? new Error(`sync for unknown match ${matchID}`) : undefined);
            },
            (error: unknown) => { next(error instanceof Error ? error : new Error(String(error))); }
          );
        });

        /* Where a refused packet lands. With no listener here socket.io
         * writes "Missing error handler on `socket`" and a stack trace for
         * every one of them — a log an unauthenticated client could fill at
         * will. Refusing a sync is routine, so it is answered with nothing. */
        socket.on("error", () => undefined);

        socket.on("update", async (...args: Parameters<Master['onUpdate']>) => {
          // The arguments are stale: we react to a player's step
          // But we are on the same API that reacts to it
          // Basically we assume that a socket.on('update', ...)
          // already updated the game state, making StateID and PlayerID stale
          const [actionData, , matchID, stalePlayerID] = args;
          if (actionData.type !== "MAKE_MOVE") {
            return;
          }
          if (isMakeMovePayloadReadOnly(actionData.payload.type)) {
            return;
          }
          if (stalePlayerID === BOT_ID) {
            return;
          }
          // The player's move is already stored and pushed; the bot answers
          // in a push of its own, or the move and its reply land as one
          // update. See #346.
          await this.getMatchQueue(matchID).add(() => this.playBotTurn(app.context, game, bot, matchID));
        });
      });
    }
  }

  /** Plays the bot's turn if the match is waiting on one, and says whether it
   *  did. Callers run it on the match's queue, so every move queued before it
   *  is stored by the time it reads.
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
  ): Promise<boolean> {
    const { state } = await fetch(db, matchID, { state: true } as const);
    if (currentPlayer(state.ctx) !== BOT_ID) {
      // Not a real action, possibly a failed move.
      return false;
    }
    if (state.ctx.gameover) {
      return false;
    }
    const botPlayer = GetBotPlayer(state, { [BOT_ID]: bot });
    if (botPlayer === null) {
      // Only reachable with ctx.gameover set to something falsy, which
      // the check above lets through and which no game here produces.
      return false;
    }
    if (state.ctx.phase !== "play" && state.ctx.phase !== "startNewGame") {
      return false;
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
    return true;
  }

  /** The bot's turn, asked for by a team whose board has waited on it too long.
   *
   *  A player's move is the only other thing that asks the bot to play, so a
   *  turn lost after the team's move was stored — a backend restart, a
   *  database error, a bot that threw — is one nobody would ever take, and the team
   *  cannot move out of turn (#133). The team's board asks again instead
   *  (`withJudgeResume`).
   *
   *  When there is no turn to take, the board that asked is behind: a reload
   *  in the bot's think time can sync before the bot's move is stored and
   *  subscribe after it is published. So the stored state is published again.
   *
   *  A queue made here for a match nobody is connected to is dropped again
   *  once idle, as boardgame.io drops one when the last client leaves. */
  async resumeBotTurn(context: Pick<Server.AppCtx, "db" | "auth">, game: Game, matchID: string): Promise<void> {
    const bot = game.name === undefined ? undefined : this.bots[game.name];
    if (bot === undefined) {
      throw new Error(`No bot plays ${game.name}.`);
    }
    const queue = this.getMatchQueue(matchID);
    try {
      await queue.add(async () => {
        if (await this.playBotTurn(context, game, bot, matchID)) {
          return;
        }
        const { state } = await fetch(context.db, matchID, { state: true } as const);
        TransportAPI(matchID, null, getFilterPlayerView(game), this.pubSub)
          .sendAll({ type: "update", args: [matchID, state] });
      });
    } finally {
      if (!this.roomInfo.has(matchID) && this.perMatchQueue.get(matchID) === queue
        && queue.size === 0 && queue.pending === 0) {
        this.deleteMatchQueue(matchID);
      }
    }
  }
}
