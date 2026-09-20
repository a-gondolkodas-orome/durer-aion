import { Local } from 'boardgame.io/multiplayer';
import type { State } from 'boardgame.io';

// boardgame.io does not export the transport types its own `Local` is written
// against, so name them off what it does export. Naming them this way keeps
// this file out of the package's build layout, which is not an API and can be
// rearranged by a patch release — the same reasoning as
// apps/online-backend/src/socketio_botmoves.ts.
type LocalOpts = NonNullable<Parameters<typeof Local>[0]>;
type MakeLocalTransport = ReturnType<typeof Local>;
type TransportOpts = Parameters<MakeLocalTransport>[0];
type TransportData = Parameters<TransportOpts['transportDataCallback']>[0];

/// Whether the match is waiting on one of the bots. The same question
/// boardgame.io's own `GetBotPlayer` answers before it lets a bot play; that
/// one is not reachable through a package entry, and this needs no more than
/// the yes or no.
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

/// `Local`, plus the one case it forgets: a saved match restored with a bot to
/// move (issue #133).
///
/// boardgame.io plays a local bot from the master's subscribe callback, and
/// fires that callback on every accepted move — but on a sync only for a match
/// it *creates*. So a match written to localStorage during the bot's turn came
/// back with nobody to move it: the bot was never asked, and the player cannot
/// play out of turn. Reloading the page mid-turn ended the match for good.
///
/// The kick below is the same call boardgame.io makes for the match it creates,
/// so its own subscription is what plays the bot — none of that is duplicated
/// here.
///
/// What it hands on is the state off the sync payload, which has been through
/// `getFilterPlayerView` for this client where boardgame.io's own call passes
/// the authoritative one: `G` through the game's `playerView`, `plugins`
/// through the plugins'. No game here defines a `playerView`, so today the two
/// are the same state. One that did would be handing its bot the guesser's
/// view of the board, which for a judge that knows the opening position is the
/// wrong half of it.
export function localWithBots({ bots, storageKey }: Pick<LocalOpts, 'bots' | 'storageKey'>) {
  const makeTransport = Local({ bots, persist: true, storageKey });
  // The state the bot was last asked to play from, whether by the kick below
  // or by boardgame.io itself. A sync at that same state — React's StrictMode
  // mounting twice, or a remount inside the bot's pause after a move — would
  // otherwise ask again, and the second answer is rejected as stale.
  let askedAt: { matchID: string, stateID: number } | null = null;

  return (transportOpts: TransportOpts) => {
    const transport = makeTransport({
      ...transportOpts,
      // Only reached from `connect()`, which the client calls after this
      // factory has returned, so `transport` is assigned by then.
      transportDataCallback: (data: TransportData) => {
        transportOpts.transportDataCallback(data);
        if (data.type === 'update' || data.type === 'patch') {
          // The match moved, and the bot has already been asked about where
          // it landed: `Master.onUpdate` calls its subscribe callback before
          // it sends this, so if the bot owes a move here, boardgame.io's own
          // 100ms timer for it is running. A sync at this state inside that
          // pause is the remount case, not the restore one, and kicking for
          // it would put the same move twice. Only these two move the match:
          // `matchData` and `chat` leave the turn where it was.
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
