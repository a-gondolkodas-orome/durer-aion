import type { BoardProps } from 'boardgame.io/react';

// A match is judged and timed where it runs — on the server online, by the
// bundled bot offline — so a board's actions stay boardgame.io moves in every
// build rather than becoming calls of their own. Online, scoring and the clock
// travel over the match's socket instead of as separate HTTP calls; offline,
// the local client judges the answer with the bundled bot, and its step report
// already goes out through RelayWrapper's sendGameData hook. What the
// repository owns either way is knowing which move carries each action.

/** The move every timed match has, relay and strategy alike. */
export interface MatchTimeMoves {
  getTime: () => void;
}

/** The relay board's own moves, on top of the shared clock. */
export interface RelayMoves extends MatchTimeMoves {
  submitAnswer: (answer: number) => void;
  startGame: () => void;
}

// boardgame.io types a board's `moves` as a string-keyed record of `any`-taking
// functions, so a move renamed in the game but not where it is dispatched
// would only show as a call to `undefined` mid-round. Narrowed where the board
// hands its moves over, it fails as the board loads instead, naming the move.
function narrowMoves<T>(moves: BoardProps['moves'], names: readonly string[]): T {
  const missing = names.filter((name) => typeof moves[name] !== 'function');
  if (missing.length > 0) {
    throw new Error(`the board is missing the move(s): ${missing.join(', ')}`);
  }
  return moves as unknown as T;
}

export function asRelayMoves(moves: BoardProps['moves']): RelayMoves {
  return narrowMoves<RelayMoves>(moves, ['submitAnswer', 'startGame', 'getTime']);
}

export function asMatchTimeMoves(moves: BoardProps['moves']): MatchTimeMoves {
  return narrowMoves<MatchTimeMoves>(moves, ['getTime']);
}

/**
 * The match actions every `ClientRepository` shares. boardgame.io has absorbed
 * the difference between the builds by the time a move is dispatched, so each
 * repository inherits these rather than carrying its own copy.
 */
export abstract class MatchMoveDispatch {
  submitRelayAnswer(answer: number, moves: RelayMoves): Promise<void> {
    moves.submitAnswer(answer);
    return Promise.resolve();
  }

  // Unlike startRelay, which moves the team to the relay page, this dispatches
  // the opening move of the match once the board is up.
  startRelayGame(moves: RelayMoves): Promise<void> {
    moves.startGame();
    return Promise.resolve();
  }

  syncMatchTime(moves: MatchTimeMoves): Promise<void> {
    moves.getTime();
    return Promise.resolve();
  }
}
