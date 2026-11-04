import type { BoardProps } from 'boardgame.io/react';
import type { Difficulty, PlayerIDType } from 'game';

// The boards dispatch their moves themselves, not through ClientRepository: a
// match is judged and timed where it runs — the server online, the bundled bot
// offline — and boardgame.io has absorbed that difference by the time a move
// is called.

/** The clock move every match has, relay and strategy alike. */
export interface MatchTimeMoves {
  getTime: () => void;
}

/** The relay board's moves. */
export interface RelayMoves extends MatchTimeMoves {
  submitAnswer: (answer: number) => void;
  startGame: () => void;
}

/** The moves gameWrapper adds to every strategy game, for its wrapper board. */
export interface StrategyWrapperMoves extends MatchTimeMoves {
  chooseNewGameType: (difficulty: Difficulty) => void;
  chooseRole: (firstPlayer: PlayerIDType) => void;
}

// One key per move, so the compiler holds each list to its interface.
const RELAY_MOVES = { submitAnswer: true, startGame: true, getTime: true } satisfies Record<keyof RelayMoves, true>;
const STRATEGY_WRAPPER_MOVES = { chooseNewGameType: true, chooseRole: true, getTime: true } satisfies Record<keyof StrategyWrapperMoves, true>;

// boardgame.io types `moves` as a record of `any` functions, so a renamed move
// would surface as a call to `undefined` mid-round. Checked here, it fails as
// the board loads, naming the move: a board missing a move is broken for the
// round either way, and this way shows the first time anyone opens it.
function narrowMoves<T>(moves: BoardProps['moves'], names: Record<keyof T, true>): T {
  const missing = Object.keys(names).filter((name) => typeof moves[name] !== 'function');
  if (missing.length > 0) {
    throw new Error(`the board is missing the move(s): ${missing.join(', ')}`);
  }
  return moves as unknown as T;
}

export function asRelayMoves(moves: BoardProps['moves']): RelayMoves {
  return narrowMoves<RelayMoves>(moves, RELAY_MOVES);
}

export function asStrategyWrapperMoves(moves: BoardProps['moves']): StrategyWrapperMoves {
  return narrowMoves<StrategyWrapperMoves>(moves, STRATEGY_WRAPPER_MOVES);
}
