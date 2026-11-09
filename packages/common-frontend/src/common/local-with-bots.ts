import { Local } from 'boardgame.io/multiplayer';

// boardgame.io does not export the transport types its own `Local` is written
// against, so name them off what it does export, rather than off its build
// layout, which a patch release may rearrange.
type LocalOpts = NonNullable<Parameters<typeof Local>[0]>;
type MakeLocalTransport = ReturnType<typeof Local>;
type TransportOpts = Parameters<MakeLocalTransport>[0];
type TransportData = Parameters<TransportOpts['transportDataCallback']>[0];

/// A persisted `Local`, plus the one case it misses: a saved match restored
/// with a bot to move (#133).
///
/// boardgame.io plays a local bot from the master's subscribe callback, which
/// it fires on every accepted move but on a sync only for a match it creates.
/// A match saved in the bot's half-second think time therefore comes back with
/// nobody to move it, and the player cannot move out of turn.
///
/// The kick below is the call boardgame.io makes for a match it creates, on
/// every sync. Whether a bot is to move is that callback's own question, so a
/// sync on the player's turn asks nothing. It reaches into the transport's
/// `master`, which the pinned boardgame.io version types but does not document;
/// local-with-bots.test.ts runs against the real one.
///
/// A second ask at the same state — a remount while the bot thinks, or the
/// sync of a match boardgame.io has just created on a bot's turn — is answered
/// twice, and boardgame.io rejects the second answer as stale and logs it.
/// That costs a console line, not a move.
///
/// The state it hands on has been through `getFilterPlayerView` for this
/// client, not the master's own: every plugin's `playerView` has been applied
/// (the random plugin's drops its data), and `deltalog`, `_undo` and `_redo`
/// are emptied. `G` and `ctx` are the master's, as no game here defines a
/// `playerView`; a game that did would hand its bot the player's view of `G`.
///
/// The master outlives its client: boardgame.io keeps one per game object for
/// the page's lifetime, and reads localStorage only when it creates it. A match
/// remounted with the same game object comes back from memory even after its
/// `bgio` keys are removed; only a reload or a new game object starts afresh.
export function localWithBots({ bots, storageKey }: Pick<LocalOpts, 'bots' | 'storageKey'>) {
  const makeTransport = Local({ bots, persist: true, storageKey });
  return (transportOpts: TransportOpts) => {
    const transport = makeTransport({
      ...transportOpts,
      // Only reached from `connect()`, which the client calls after this
      // factory has returned, so `transport` is assigned by then.
      transportDataCallback: (data: TransportData) => {
        transportOpts.transportDataCallback(data);
        if (data.type === 'sync') {
          const [matchID, { state }] = data.args;
          transport.master.subscribeCallback({ state, matchID });
        }
      },
    });
    return transport;
  };
}
