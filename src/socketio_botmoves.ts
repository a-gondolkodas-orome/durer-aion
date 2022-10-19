// Demultiplexes to real transport or bots

import type { Game, State, StorageAPI } from "boardgame.io";
import { getFilterPlayerView } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { SocketIO } from "boardgame.io/server";
import { currentPlayer } from "./common/types";
import { getBotCredentials } from "./server";

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
const TransportAPI = (
  matchID: string,
  socket: any,
  filterPlayerView: any,
  pubSub: any
): any => {
  const send : (arg1: any, ...arg2: any) => void = ({ playerID, ...data }) => {
    emit(socket, filterPlayerView(playerID, data));
  };

  const sendAll = (payload: any) => {
    pubSub.publish(getPubSubChannelId(matchID), payload);
  };

  return { send, sendAll };
};

/** Copied from boardgame.io/dist/src/master/master.ts */
export async function fetch(db: StorageAPI.Async | StorageAPI.Sync, matchID: string, partial: Partial<{ state: boolean, metadata: boolean, logs: boolean, initialState: boolean }>) {
  return isSynchronous(db)
      ? db.fetch(matchID, partial)
      : await db.fetch(matchID, partial);
}

/// Bot's playerID is '1', because the gameWrapper uses player '0' for the human player. 
export const BOT_ID = '1';

/** This is a special transport specifically designed for replacing a player's move
 * with a bot's move.
 * 
 * BOT_ID represents the player to replace.
 * 
 * Modifying the server is also needed to fill the bot's slot in the lobby (see injectBots()).
 */
export class SocketIOButBotMoves extends SocketIO {
  bots: Record<string, any>;
  onFinishedMatch: (matchID: string) => void;
  constructor(anything: any, bots: Record<string, any>, onFinishedMatch: (matchID: string)=>void = ()=>{}) {
    super(anything);
    this.bots = bots;
    this.onFinishedMatch = onFinishedMatch;
  }
  init(
    app: any,
    games: Game[],
    origins: any
  ) {
    super.init(app, games, origins);

    for (const game of games) {
      const nsp = app._io.of(game.name);
      const bot = this.bots[game.name!];

      /** This should be in sync with how socket data is communicated.
       * See boardgame.io/dist/src/server/transport/socketio.ts
       */
      nsp.on('connection', (socket: any) => {
        socket.on('update', async (...args: Parameters<any>) => {
          // The arguments are stale: we react to a player's step
          // But we are on the same API that reacts to it
          // Basically we assume that a socket.on('update', ...)
          // already updated the gamestate, making StateID and PlayerID stale
          const [_, staleStateID, matchID, stalePlayerID] : any[] = args;
          const matchQueue = this.getMatchQueue(matchID);
          await matchQueue.add(async () => {
            // These happen after the player stepped.
            // The state is written to storage, and the server now returned
            // the authorative state to the player.
            // TODO do not load the result from storage, reuse from the redux?
            // TODO try do not send an authorative state to the player...?
            console.log("Bot moves");

            if (stalePlayerID === BOT_ID) {
              // Do not react to bot's turn
              return;
            }
            const {state} = await fetch(app.context.db, matchID, {state: true});
            if (currentPlayer(state.ctx) !== BOT_ID) {
              // Not a real action, possibly a failed move.
              return;
            }
            let botAction = undefined;
            if (state.ctx.phase === 'play' || state.ctx.phase === 'startNewGame'){
              botAction = await bot.play(
                state,
                GetBotPlayer(state, {[BOT_ID]: bot}) as any
              );
            } else {
              return;
            }
            
            const master = new Master(
              game,
              app.context.db,
              TransportAPI(matchID, socket, getFilterPlayerView(game), this.pubSub),
              app.context.auth
            );

            // TODO: is staleStateID+1 always valid?
            let nextStateID = staleStateID+1;
            await master.onUpdate({type: 'MAKE_MOVE', payload: {...botAction.action.payload, credentials: getBotCredentials()}}, nextStateID, matchID, BOT_ID);
          });
          await matchQueue.add(async () => {
            const {state} = await fetch(app.context.db, matchID, {state: true});
            if (state.ctx.gameover) {
              this.onFinishedMatch(matchID);
            }
          });
        });
      });
    }
  }
}
