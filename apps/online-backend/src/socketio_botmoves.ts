// Demultiplexes to real transport or bots

import type { Game, State, StorageAPI } from "boardgame.io";
import { getFilterPlayerView } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { SocketIO } from "boardgame.io/server";
import { isMakeMovePayloadReadOnly, currentPlayer } from "game";
import { getBotCredentials } from "./server/common";

/** Copied from boardgame.io/dist/src/client/transport/local.ts */
function GetBotPlayer(state: State, bots: Record<string, any>) {
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

/** Copied from boardgame.io/dist/src/server/db/base.ts */
export enum Type {
  SYNC = 0,
  ASYNC = 1,
}

/** Copied from boardgame.io/dist/src/server/transport.ts */
export function isSynchronous(storageAPI: any): any {
  return storageAPI.type() === Type.SYNC;
}

/** Used by TransportAPI. Copied from boardgame.io/dist/src/server/transport.ts */
const emit = (socket: any, { type, args }: any) => {
  socket.emit(type, ...args);
};

/** Used by TransportAPI. Copied from boardgame.io/dist/src/server/transport.ts */
function getPubSubChannelId(matchID: string): string {
  return `MATCH-${matchID}`;
}

/** Copied from boardgame.io/dist/src/server/transport.ts */
export const TransportAPI = (
  matchID: string,
  socket: any,
  filterPlayerView: any,
  pubSub: any
): any => {
  const send: (arg1: any, ...arg2: any) => void = ({ playerID, ...data }) => {
    emit(socket, filterPlayerView(playerID, data));
  };

  const sendAll = (payload: any) => {
    pubSub.publish(getPubSubChannelId(matchID), payload);
  };

  return { send, sendAll };
};

/** Copied from boardgame.io/dist/src/master/master.ts */
export async function fetch(
  db: StorageAPI.Async | StorageAPI.Sync,
  matchID: string,
  partial: Partial<{
    state: boolean;
    metadata: boolean;
    logs: boolean;
    initialState: boolean;
  }>
) {
  return isSynchronous(db)
    ? db.fetch(matchID, partial)
    : await db.fetch(matchID, partial);
}

/// Bot's playerID is '1', because the gameWrapper uses player '0' for the human player. 
export const BOT_ID = "1";

/** This is a special transport specifically designed for replacing a player's move
 * with a bot's move.
 * 
 * BOT_ID represents the player to replace.
 * 
 * Modifying the server is also needed to fill the bot's slot in the lobby (see injectBots()).
 */
export class SocketIOButBotMoves extends SocketIO {
  bots: Record<string, any>;
  onFinishedMatch: (matchID: string) => Promise<void>;
  unFinishedMatches = new Set<string>();
  constructor(
    anything: any,
    bots: Record<string, any>,
    onFinishedMatch: (matchID: string) => Promise<void> = async () => {}
  ) {
    super({ ...anything });
    this.bots = bots;
    this.onFinishedMatch = onFinishedMatch;
  }
  init(app: any, games: Game[], origins: any) {
    super.init(app, games, origins);

    for (const game of games) {
      const nsp = app._io.of(game.name);
      const bot = this.bots[game.name!];

      /** This should be in sync with how socket data is communicated.
       * See boardgame.io/dist/src/server/transport/socketio.ts
       */
      nsp.on("connection", (socket: any) => {
        socket.on("update", async (...args: Parameters<any>) => {
          // The arguments are stale: we react to a player's step
          // But we are on the same API that reacts to it
          // Basically we assume that a socket.on('update', ...)
          // already updated the game state, making StateID and PlayerID stale
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [actionData, _, matchID, stalePlayerID]: any[] = args;
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
             });
            if (currentPlayer(state.ctx) !== BOT_ID) {
              // Not a real action, possibly a failed move.
              return;
            }
            if (state.ctx.gameover) {
              // Game is over, no need to react
              return;
            }
            let botAction = undefined;
            if (
              state.ctx.phase === "play" ||
              state.ctx.phase === "startNewGame"
            )  {
              botAction = await bot.play(
                state,
                GetBotPlayer(state, { [BOT_ID]: bot }) as any
              );
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

            let nextStateID = state._stateID;
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
             });
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
