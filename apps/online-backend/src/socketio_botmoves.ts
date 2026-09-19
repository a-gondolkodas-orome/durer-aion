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
        /** Refuses a `sync` naming a match that storage does not have, and for
         * one it does, hands the packet to `resumeBotTurn` before letting it
         * through.
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
        socket.use(([event, matchID, playerID, credentials]: IOTypes.Event, next) => {
          if (event !== "sync") {
            next();
            return;
          }
          if (typeof matchID !== "string" || matchID === "") {
            next(new Error("sync without a match id"));
            return;
          }
          void fetch(app.context.db, matchID, { metadata: true } as const).then(
            async ({ metadata }) => {
              if (metadata === undefined) {
                next(new Error(`sync for unknown match ${matchID}`));
                return;
              }
              await this.resumeBotTurn(app, game, bot, matchID, metadata, playerID, credentials);
              next();
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
          await this.takeBotTurn(app, game, socket, bot, matchID);
        });
      });
    }
  }

  /** The other half of the job `update` does. A player's move is the only
   *  other thing that asks the bot to play, so a match whose bot move never
   *  happened — the backend restarted mid-turn, or the bot's own update lost a
   *  stateID race — is one nobody will ever move again: the team cannot play
   *  out of turn, and the board sits on "waiting for the server" for good
   *  (issue #133). A reconnect is the moment someone is there to be stuck, so
   *  it is where the server looks again.
   *
   *  Run from the sync middleware rather than from a second `sync` listener,
   *  because a listener beside boardgame.io's own can do neither of the two
   *  things this needs. It cannot see the credential check: `Master.onSync`
   *  makes it and answers nothing when it fails, so a sibling would take the
   *  turn for a caller boardgame.io had just refused. And it cannot order
   *  itself against the answer: boardgame.io puts the socket on the match's
   *  pubsub channel only after `onSync` returns, so a bot move published
   *  before that reaches nobody, while the answer already on its way carries
   *  the state from before it — #133 again, on the very reload meant to cure
   *  it. From the middleware the turn is taken *first*, and `onSync` reads it
   *  back out of storage, so the answer carries the bot's move instead of
   *  racing it. What that costs is the bot's thinking time added to the one
   *  sync that lands on its turn, which is the right way round: the team waits
   *  once and sees the board it should, rather than seeing a stale one at once
   *  and depending on a push that may never arrive.
   *
   *  Answers nothing and throws nothing: a bot that could not play is no
   *  reason to drop the team's sync. */
  private async resumeBotTurn(
    app: Server.App,
    game: Game,
    bot: Bot,
    matchID: string,
    metadata: Server.MatchData,
    playerID: unknown,
    credentials: unknown
  ): Promise<void> {
    // `Master.onSync` skips this when playerID is null — the spectator case —
    // and a spectator is not who the bot owes a move to, so this skips the
    // turn instead of the check.
    if (typeof playerID !== "string") {
      return;
    }
    try {
      const authentic = await app.context.auth.authenticateCredentials({
        playerID,
        credentials: typeof credentials === "string" ? credentials : undefined,
        metadata,
      });
      if (!authentic) {
        return;
      }
      // No socket: `Master.onUpdate` only ever publishes to the match's
      // channel, and this caller is not on it yet — the router's add-minutes
      // handler passes null for the same reason.
      await this.takeBotTurn(app, game, null, bot, matchID);
    } catch (error) {
      console.error(`could not take the bot's turn on a sync for match ${matchID}`, error);
    }
  }

  /** Plays the bot's turn if the match is waiting on one, and closes the match
   *  if that turn ended it. Both halves go through the match's own queue, which
   *  is what lets a player's move and a reconnect both call this: whichever
   *  runs second finds the turn already taken and does nothing.
   *
   *  The second half runs whether or not the first played: the move that ends
   *  a match is often the team's own, `turn.onMove` calling `events.endGame()`
   *  on a move made after the clock ran out (a game's `game.ts`). Reading the
   *  state back for a reconnect that moved nothing is the price of that. */
  private async takeBotTurn(
    app: Server.App,
    game: Game,
    socket: IOTypes.Socket | null,
    bot: Bot,
    matchID: string
  ): Promise<void> {
    const matchQueue = this.getMatchQueue(matchID);
    await matchQueue.add(async () => {
      // These happen after the player stepped.
      // The state is written to storage, and the server now returned
      // the authoritative state to the player.
      // TODO: do not load the result from storage, reuse from the redux?
      // TODO: try do not send an authoritative state to the player...?
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
      if (state.ctx.phase !== "play" && state.ctx.phase !== "startNewGame") {
        return;
      }
      // Said here rather than on the way in: a reconnect asks this of every
      // match a team opens, and only the ones the bot really owes a move are
      // a turn being taken.
      console.log("Bot moves");
      this.unFinishedMatches.add(matchID);
      const botAction = await bot.play(state, botPlayer);

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
  }
}
