// Demultiplexes to real transport or bots

// The types below describe the socket.io this workspace declares. That used to
// be a different copy from the one boardgame.io actually serves matches with,
// which reaches it through `koa-socket-2`; the root package.json's `overrides`
// block is what makes them one install, and socketio_transport.test.ts fails if
// they split again (#461).
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

/** Narrows a value that arrived over the socket, where the declared argument
 *  types describe what a well-behaved client sends rather than what anyone
 *  can send. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
        /** Refuses a packet naming a match that storage does not have.
         *
         * boardgame.io's `Master.onSync` skips its credential check when
         * `playerID` is null — the spectator case it is written for — and
         * creates and persists a match when it finds none under the id it was
         * given. Between the two, anonymous socket traffic writes rows into
         * Postgres for as long as it cares to, none of which any team can
         * reach and nothing of which asks who is asking.
         *
         * `update` and `chat` do not create anything, but they are read with
         * the same client-chosen id before anyone has been authenticated, and
         * each of them keys an in-memory map off it that nothing evicts from —
         * boardgame.io's `perMatchQueue` and this class's `unFinishedMatches`.
         * An unknown id also leaves `update` reading state that is not there
         * (#437).
         *
         * A match here is only ever created by the server, for a team that
         * asked for one (`server/team_manage.ts`), and the id reaches a
         * browser only in that answer. So a packet naming a match storage does
         * not have belongs to no client of this competition, and it never
         * reaches boardgame.io's listener. What the check establishes is that
         * the id names a real match, and nothing more: who may act on that
         * match is still the Master's credential check to decide.
         *
         * A packet middleware rather than a wrapped listener: it is the hook
         * socket.io documents for this, and it does not depend on what the
         * base transport registered before us. A refused packet is dropped
         * with no answer to the client, and socket.io's own `Socket` carries
         * the noop `error` listener that keeps that from throwing.
         */
        const refusalFor = async ([event, ...args]: IOTypes.Event): Promise<string | undefined> => {
          const at = MATCH_ID_ARGUMENT.get(String(event));
          if (at === undefined) return undefined;
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
         * each check runs after the one before it, which leaves the socket's
         * packets in the order the client sent them. The cost is that a read
         * storage is slow to answer holds up that socket's later packets —
         * one team's board, where a reordered move is a lost one. */
        let checked: Promise<unknown> = Promise.resolve();
        socket.use((packet: IOTypes.Event, next) => {
          const released = checked.then(() => refusalFor(packet));
          // The next packet waits for this check to have finished, not for it
          // to have passed: one refusal must not refuse everything behind it.
          checked = released.then(() => undefined, () => undefined);
          void released.then(
            reason => {
              if (reason === undefined) next();
              else refuse(reason, next);
            },
            // The check answers rather than throws, so anything here is a bug
            // in it — and a packet must not be let past on the strength of one.
            (error: unknown) => { refuse(`the check itself failed: ${String(error)}`, next); }
          );
        });

        const onPlayerUpdate = async (...args: Parameters<Master['onUpdate']>) => {
          // The arguments are stale: we react to a player's step
          // But we are on the same API that reacts to it
          // Basically we assume that a socket.on('update', ...)
          // already updated the game state, making StateID and PlayerID stale
          const [actionData, , matchID, stalePlayerID] = args;
          // That the match exists is what the guard above established, which
          // is also what bounds this set: the id is the client's, and nothing
          // evicts from here except a match reaching its end.
          //also we assume, this event can't happen, after the game is finished
          this.unFinishedMatches.add(matchID);
          // The action is the client's too, and the guard said nothing about
          // it — read no further into it than each check has reached.
          if (!isRecord(actionData) || actionData.type !== "MAKE_MOVE") {
            // skip if alma type is not 'MAKE_MOVE'
            return;
          }
          const payloadType: unknown = isRecord(actionData.payload) ? actionData.payload.type : undefined;
          if (typeof payloadType !== "string") {
            return;
          }
          if (isMakeMovePayloadReadOnly(payloadType)) {
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
            // the authoritative state to the player.
            // TODO: do not load the result from storage, reuse from the redux?
            // TODO: try do not send an authoritative state to the player...?
            console.log("Bot moves");

            const {  state  } = await fetch(app.context.db, matchID, {
               state: true,
             } as const);
            // Only reachable if the match went away between the guard above
            // and this read. Nothing in this codebase deletes one, but
            // `state.ctx` off an absent match is what an unknown id used to
            // reach, and that took the whole server down with it (#437).
            if (state === undefined) return;
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
            if (state === undefined) return;
            if (state.ctx.gameover) {
              if (this.unFinishedMatches.has(matchID)) {
                this.unFinishedMatches.delete(matchID);
                await this.onFinishedMatch(matchID);
              }
            }
          });
        };

        socket.on("update", (...args: Parameters<Master['onUpdate']>) => {
          /* socket.io does not wait for a listener's promise, so a rejection
           * in there reaches nothing but node's unhandled-rejection handling,
           * which ends the process and every match being played on it. The
           * bot's turn is worth losing on its own; the round is not. */
          void onPlayerUpdate(...args).catch((error: unknown) => {
            console.error(`Reacting to an update for match ${String(args[2])} failed:`, error);
          });
        });
      });
    }
  }
}
