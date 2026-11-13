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

/** Narrows a value that arrived over the socket, where the declared argument
 *  types describe what a well-behaved client sends rather than what anyone
 *  can send. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** The packets boardgame.io's transport answers with a match id the client
 *  chose, and where in each one's arguments that id sits: `sync` and `chat`
 *  lead with it, `update` sends the action and the stale stateID first. See
 *  its `nsp.on("connection")` listener; `disconnect` is the only other packet
 *  it registers, and that one carries no id. */
const MATCH_ID_ARGUMENT: ReadonlyMap<string, number> = new Map([
  ["sync", 0],
  ["update", 2],
  ["chat", 0],
]);

/** socket.io does not wait for a listener's promise, so a rejection in one
 *  reaches nothing but node's unhandled-rejection handling, which ends the
 *  process and every match being played on it. A lost bot turn is one a sync
 *  takes again; the round is not. */
const logListenerFailure = (event: string, matchID: unknown) => (error: unknown) => {
  console.error(`Reacting to a ${event} for match ${String(matchID)} failed:`, error);
};

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
        /** Refuses a packet naming a match that storage does not have.
         *
         * boardgame.io's `Master.onSync` skips its credential check when
         * `playerID` is null — the spectator case it is written for — and
         * creates and persists a match when it finds none under the id it was
         * given. Between the two, anonymous socket traffic writes rows into
         * Postgres for as long as it cares to, none of which any team can
         * reach and nothing of which asks who is asking.
         *
         * `update` and `chat` create nothing, but they are read with the same
         * client-chosen id before anyone has been authenticated: each keys
         * boardgame.io's `perMatchQueue` off it, and `update` has the bot hook
         * below read the match it names.
         *
         * A match here is only ever created by the server, for a team that
         * asked for one (`server/team_manage.ts`), and the id reaches a
         * browser only in that answer. So a packet naming a match storage does
         * not have belongs to no client of this competition, and it never
         * reaches boardgame.io's listener. The check says the id names a real
         * match and nothing more: who may act on it is still the Master's
         * credential check to decide.
         *
         * A packet middleware rather than a wrapped listener: it is the hook
         * socket.io documents for this, and it does not depend on what the
         * base transport registered before us. A refused packet is dropped
         * with no answer, and lands on the noop `error` listener socket.io's
         * own `Socket` attaches.
         */
        const refusalFor = async ([event, ...args]: IOTypes.Event): Promise<string | undefined> => {
          const at = MATCH_ID_ARGUMENT.get(String(event));
          if (at === undefined) {
            return undefined;
          }
          const matchID: unknown = args[at];
          if (typeof matchID !== "string" || matchID === "") {
            return `${String(event)} without a match id`;
          }
          try {
            const { metadata } = await fetch(app.context.db, matchID, { metadata: true } as const);
            return metadata === undefined ? `${String(event)} for unknown match ${matchID}` : undefined;
          } catch (error: unknown) {
            // Said differently from a match nobody created, because the two
            // call for opposite reactions: this one is the server's to fix.
            return `storage could not be read for match ${matchID}: ${String(error)}`;
          }
        };

        /* One line per socket rather than one per refusal: how many packets
         * arrive is the client's choice, so a socket that keeps at it must not
         * be able to fill the log. The first refusal is the one worth having —
         * it is the only trace that a real team, and not a stray client, ran
         * into the check. */
        let reported = false;
        const refuse = (reason: string, next: (error: Error) => void) => {
          if (!reported) {
            reported = true;
            console.warn(`Refused a packet on socket ${socket.id}: ${reason}`);
          }
          next(new Error(reason));
        };

        /* socket.io hands each packet to the middleware as it arrives and does
         * not wait for the one before it, so the storage read above would let
         * packets overtake each other. boardgame.io rejects a move whose
         * stateID is stale, so a swapped pair of updates costs a team a move:
         * each check starts once the one before it has released its packet,
         * which leaves the socket's packets in the order the client sent them.
         * The cost is that a slow read holds up that socket's later packets —
         * one team's board, where a reordered move is a lost one. */
        let checked: Promise<unknown> = Promise.resolve();
        socket.use((packet: IOTypes.Event, next) => {
          const released = checked.then(() => refusalFor(packet)).then(
            (reason) => {
              if (reason === undefined) {
                next();
              } else {
                refuse(reason, next);
              }
            },
            // refusalFor answers rather than throws, so anything here is a
            // bug in it — and a packet must not be let past on one.
            (error: unknown) => { refuse(`the check itself failed: ${String(error)}`, next); }
          );
          // The next packet waits for this one to be dealt with, not for it to
          // have passed: one refusal must not refuse everything behind it.
          checked = released.catch(() => undefined);
        });

        socket.on("update", (...args: Parameters<Master['onUpdate']>) => {
          void this.onPlayerUpdate(app.context, game, bot, args).catch(logListenerFailure("update", args[2]));
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

  /** Has the bot answer a player's move, if the move asks for an answer.
   *
   *  The arguments are stale: boardgame.io's own `update` listener has
   *  already applied the move by the time the match queue gets to this, so
   *  the state and player ID the client sent describe the match before it.
   *
   *  The action is the client's to shape, and the packet guard said nothing
   *  about it, so nothing here reads further into it than has been checked. */
  private async onPlayerUpdate(
    context: Pick<Server.AppCtx, "db" | "auth">,
    game: Game,
    bot: Bot,
    [actionData, , matchID, stalePlayerID]: Parameters<Master['onUpdate']>
  ): Promise<void> {
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
    // The packet guard lets through only ids storage has, so this is a match
    // that went away since — which nothing here does, but `state.ctx` off an
    // absent one is a rejection, not a skipped turn.
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
