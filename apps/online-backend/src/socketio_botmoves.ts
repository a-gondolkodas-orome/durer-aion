// Demultiplexes to real transport or bots
import type IOTypes from 'socket.io';
import type { Game, PlayerID, Server, State, StorageAPI } from "boardgame.io";
import type { Bot } from "boardgame.io/ai";
import { getFilterPlayerView, Sync as SyncStorage } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { GenericPubSub, SocketIO } from "boardgame.io/server";
import { isMakeMovePayloadReadOnly, currentPlayer, PlayerIDType } from "game";
import { getBotCredentials } from "./server/common";
import { CorsOptionsDelegate } from "cors";

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
  onFinishedMatch: (matchID: string) => Promise<void>;
  unFinishedMatches = new Set<string>();
  constructor(
    socketOpts: SocketOpts,
    bots: Record<string, Bot>,
    onFinishedMatch: (matchID: string) => Promise<void> = async () => undefined
  ) {
    super({ ...socketOpts });
    this.bots = bots;
    this.onFinishedMatch = onFinishedMatch;
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
        socket.on("update", async (...args: Parameters<Master['onUpdate']>) => {
          // The arguments are stale: we react to a player's step
          // But we are on the same API that reacts to it
          // Basically we assume that a socket.on('update', ...)
          // already updated the game state, making StateID and PlayerID stale
          const [actionData, , matchID, stalePlayerID] = args;
          //this in theory means, that the match already exist
          //also we assume, this event can't happen, after the game is finished
          this.unFinishedMatches.add(matchID);
          if (actionData.type !== "MAKE_MOVE") {
            // skip if alma type is not 'MAKE_MOVE'
            return;
          }
          if (isMakeMovePayloadReadOnly(actionData.payload.type)) {
            // also skip if payload type is getTime
            return;
          }
          if (stalePlayerID === BOT_ID) {
            // Do not react to bot's turn
            return;
          }
          const matchQueue = this.getMatchQueue(matchID);
          await matchQueue.add(async () => {
            // These happen after the player stepped.
            // The state is written to storage, and the server now returned
            // the authorative state to the player.
            // TODO: do not load the result from storage, reuse from the redux?
            // TODO: try do not send an authorative state to the player...?
            console.log("Bot moves");

            const {  state  } = await fetch(app.context.db, matchID, {
               state: true,
             } as const);
            if (currentPlayer(state.ctx) !== BOT_ID) {
              // Not a real action, possibly a failed move.
              return;
            }
            if (state.ctx.gameover) {
              // Game is over, no need to react
              return;
            }
            const botPlayer = GetBotPlayer(state, { [BOT_ID]: bot });
            if (botPlayer === null) {
              // Only reachable with ctx.gameover set to something falsy, which
              // the check above lets through and which no game here produces.
              return;
            }
            let botAction;
            if (
              state.ctx.phase === "play" ||
              state.ctx.phase === "startNewGame"
            )  {
              botAction = await bot.play(state, botPlayer);
            } else {
              return;
            }

            const master = new Master(
              game,
              app.context.db,
              TransportAPI(
                matchID,
                socket,
                getFilterPlayerView(game),
                this.pubSub
              ),
              app.context.auth
            );

            const nextStateID = state._stateID;
            await master.onUpdate(
              {
                type: "MAKE_MOVE",
                payload: {
                  ...botAction.action.payload,
                  credentials: getBotCredentials(),
                },
              },
              nextStateID,
              matchID,
              BOT_ID
            );
          });
          await matchQueue.add(async () => {
            const {  state  } = await fetch(app.context.db, matchID, {
               state: true,
             } as const);
            if (state.ctx.gameover) {
              if (this.unFinishedMatches.has(matchID)) {
                this.unFinishedMatches.delete(matchID);
                await this.onFinishedMatch(matchID);
              }
            }
          });
        });
      });
    }
  }
}
