import type { BoardProps } from 'boardgame.io/react';

// A match is judged and timed where it runs — the server online, the bundled
// bot offline — so a board's actions are boardgame.io moves in every build.
// Online they travel over the match's socket; offline the step report already
// goes out through RelayWrapper's sendGameData hook, so nothing else is sent.

/** The clock move every match has, relay and strategy alike. */
export interface MatchTimeMoves {
  getTime: () => void;
}

/** The relay board's moves. */
export interface RelayMoves extends MatchTimeMoves {
  submitAnswer: (answer: number) => void;
  startGame: () => void;
}

// boardgame.io types `moves` as a record of `any` functions, so a renamed move
// would surface as a call to `undefined` mid-round. Checked here, it fails as
// the board loads, naming the move.
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

/** The match moves every `ClientRepository` shares: by the time a move is
 * dispatched, boardgame.io has absorbed the difference between the builds. */
export abstract class MatchMoveDispatch {
  submitRelayAnswer(answer: number, moves: RelayMoves): Promise<void> {
    moves.submitAnswer(answer);
    return Promise.resolve();
  }

  // The match's opening move, once the board is up; `startRelay` only opens
  // the relay page.
  startRelayGame(moves: RelayMoves): Promise<void> {
    moves.startGame();
    return Promise.resolve();
  }

  syncMatchTime(moves: MatchTimeMoves): Promise<void> {
    moves.getTime();
    return Promise.resolve();
  }
}
