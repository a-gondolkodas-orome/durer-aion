import { JUDGE_PLAYER } from 'game';
import type { Local, SocketIO } from 'boardgame.io/multiplayer';

/// How long a bot's move waits on screen behind whatever came before it: the
/// team's own move, or the bot's previous move in a turn of several.
export const BOT_MOVE_PAUSE_MS = 400;

type MakeTransport = ReturnType<typeof SocketIO> | ReturnType<typeof Local>;
type TransportOpts = Parameters<MakeTransport>[0];
type TransportData = Parameters<TransportOpts['transportDataCallback']>[0];

/// Whether the message carries a move the bot made: its log names the bot as
/// the player of a move.
function isBotMove(data: TransportData): boolean {
  if (data.type !== 'update' && data.type !== 'patch') return false;
  const log = data.type === 'update' ? data.args[2] : data.args[4];
  return (log ?? []).some(({ action }) => action.type === 'MAKE_MOVE' && action.payload.playerID === JUDGE_PLAYER);
}

/// Hands the messages on in the order they came, holding back a bot's move
/// until it has been BOT_MOVE_PAUSE_MS since the last state was shown.
///
/// The bot itself does not pause: the server plays its whole turn at once, so
/// a reload in the middle of it loses no move, only the sight of each one in
/// turn (docs/ARCHITECTURE.md § *How the bot gets its turn*). Everything
/// behind a held message waits with it, so nothing is applied out of order:
/// boardgame.io drops a `patch` that does not follow the state it has, and an
/// `update` older than it, which is also what makes a `sync` overtaking a held
/// move harmless.
export function pacer(deliver: (data: TransportData) => void): (data: TransportData) => void {
  const queue: TransportData[] = [];
  let lastShown = -Infinity;
  let waiting = false;

  const flush = () => {
    waiting = false;
    while (queue.length > 0) {
      const data = queue[0];
      const due = lastShown + BOT_MOVE_PAUSE_MS;
      if (isBotMove(data) && Date.now() < due) {
        waiting = true;
        setTimeout(flush, due - Date.now());
        return;
      }
      queue.shift();
      deliver(data);
      if (data.type === 'update' || data.type === 'patch' || data.type === 'sync') lastShown = Date.now();
    }
  };

  return (data) => {
    queue.push(data);
    if (!waiting) flush();
  };
}

/// A transport whose bot moves reach the board at a pace a team can follow.
export function paceBotMoves<T extends MakeTransport>(makeTransport: T): T {
  return ((transportOpts: TransportOpts) => makeTransport({
    ...transportOpts,
    transportDataCallback: pacer(transportOpts.transportDataCallback),
  })) as T;
}
