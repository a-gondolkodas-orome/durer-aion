import type { MoveFn, MoveMap } from 'boardgame.io';

/// What a timestamped move adds to its entry in boardgame.io's match log, the
/// one the organisers read with `GET /game/admin/:matchId/logs`. The log
/// itself records no time; the server's clock at the move is what is stored.
export interface MoveLogMetadata {
  time: string;
}

function timestamp<G>(move: MoveFn<G>): MoveFn<G> {
  return (context, ...args) => {
    context.log.setMetadata({ time: new Date().toISOString() } satisfies MoveLogMetadata);
    return move(context, ...args);
  };
}

/// Wraps each move so its log entry carries the time it was made. A move that
/// sets log metadata of its own replaces this. Leave clock polls out: they are
/// not steps of the match, and stamping them only floods the log.
export function timestampMoves<G>(moves: MoveMap<G>): MoveMap<G> {
  return Object.fromEntries(Object.entries(moves).map(([name, move]) => [
    name,
    typeof move === 'function' ? timestamp(move) : { ...move, move: timestamp(move.move) },
  ]));
}
