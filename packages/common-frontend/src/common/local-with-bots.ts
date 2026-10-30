import { Local } from 'boardgame.io/multiplayer';
import type { State } from 'boardgame.io';

// boardgame.io does not export the transport types its own `Local` is written
// against, so name them off what it does export, rather than off its build
// layout, which a patch release may rearrange.
type LocalOpts = NonNullable<Parameters<typeof Local>[0]>;
type MakeLocalTransport = ReturnType<typeof Local>;
type TransportOpts = Parameters<MakeLocalTransport>[0];
type TransportData = Parameters<TransportOpts['transportDataCallback']>[0];

/// Whether the match is waiting on one of the bots: the question boardgame.io's
/// own `GetBotPlayer` answers before it lets a bot play, which no package entry
/// exports.
function botOwesAMove(state: State, bots: LocalOpts['bots']): boolean {
  const { activePlayers, currentPlayer, gameover } = state.ctx;
  if (bots === undefined || gameover !== undefined) {
    return false;
  }
  if (activePlayers) {
    return Object.keys(bots).some(playerID => playerID in activePlayers);
  }
  return currentPlayer in bots;
}

/// A persisted `Local`, plus the one case it misses: a saved match restored
/// with a bot to move (#133).
///
/// boardgame.io plays a local bot from the master's subscribe callback, which
/// it fires on every accepted move but on a sync only for a match it creates.
/// A match saved in the bot's half-second think time therefore comes back with
/// nobody to move it, and the player cannot move out of turn.
///
/// The kick below is the call boardgame.io makes for a match it creates, so
/// its own subscription still plays the bot. It reaches into the transport's
/// `master`, which the pinned boardgame.io version types but does not document;
/// local-with-bots.test.ts runs against the real one.
///
/// The state it hands on has been through `getFilterPlayerView` for this
/// client. No game here defines a `playerView`, so that is the full state; a
/// game that did would hand its bot the player's view of the board.
export function localWithBots({ bots, storageKey }: Pick<LocalOpts, 'bots' | 'storageKey'>) {
  const makeTransport = Local({ bots, persist: true, storageKey });
  // The state the bot was last asked to play from, by the kick below or by
  // boardgame.io itself. A sync at that same state — StrictMode mounting
  // twice, or a remount in the pause after a move — would otherwise ask again,
  // and the second answer is rejected as stale.
  let askedAt: { matchID: string, stateID: number } | null = null;

  return (transportOpts: TransportOpts) => {
    const transport = makeTransport({
      ...transportOpts,
      // Only reached from `connect()`, which the client calls after this
      // factory has returned, so `transport` is assigned by then.
      transportDataCallback: (data: TransportData) => {
        transportOpts.transportDataCallback(data);
        if (data.type === 'update' || data.type === 'patch') {
          // `Master.onUpdate` runs its subscribe callback before it sends
          // this, so if the bot owes a move here, boardgame.io has already
          // scheduled it. Only these two move the match; `matchData` and
          // `chat` leave the turn where it was.
          const [matchID] = data.args;
          const stateID = data.type === 'update' ? data.args[1]._stateID : data.args[2];
          askedAt = { matchID, stateID };
          return;
        }
        if (data.type !== 'sync') {
          return;
        }
        const [matchID, { state }] = data.args;
        if (!botOwesAMove(state, bots)) {
          return;
        }
        if (askedAt?.matchID === matchID && askedAt.stateID === state._stateID) {
          return;
        }
        askedAt = { matchID, stateID: state._stateID };
        transport.master.subscribeCallback({ state, matchID });
      },
    });
    return transport;
  };
}
