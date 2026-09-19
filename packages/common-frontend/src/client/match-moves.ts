import i18n from "i18next";
import type { BoardProps } from "boardgame.io/react";

// A match is judged and timed where it runs — on the server online, by the
// bundled bot offline — so a board's actions stay boardgame.io moves in every
// build rather than becoming calls of their own. Online that means scoring and
// the clock travel over the match's socket instead of as separate HTTP calls;
// offline the local client judges the answer with the bundled bot, and its step
// report already goes out through RelayWrapper's sendGameData hook. What the
// repository owns either way is knowing which move carries each action, and
// whether a dispatch could have been lost on the way.

/** The move every timed match has, relay and strategy alike. */
export interface MatchTimeMoves {
  getTime: () => void;
}

/** The relay board's own moves, on top of the shared timer. */
export interface RelayMoves extends MatchTimeMoves {
  submitAnswer: (answer: number) => void;
  startGame: () => void;
}

/** What boardgame.io reports about the board's link to the match. */
export interface MatchConnection {
  isMultiplayer: boolean;
  isConnected: boolean;
}

const RELAY_MOVE_NAMES = ["submitAnswer", "startGame", "getTime"] as const;
const MATCH_TIME_MOVE_NAMES = ["getTime"] as const;

function narrowMoves<T>(moves: BoardProps["moves"], names: readonly string[]): T {
  const missing = names.filter((name) => typeof moves[name] !== "function");
  if (missing.length > 0) {
    throw new Error(`the board is missing the move(s): ${missing.join(", ")}`);
  }
  return moves as unknown as T;
}

// boardgame.io types a board's `moves` as a plain string-keyed record of
// `any`-taking functions, so nothing catches a move renamed in the game but not
// where it is dispatched: the call would just be `undefined` mid-round.
// Narrowing once, where the board hands its moves over, turns that into a named
// error and lets everything below take a typed argument instead.
export function asRelayMoves(moves: BoardProps["moves"]): RelayMoves {
  return narrowMoves<RelayMoves>(moves, RELAY_MOVE_NAMES);
}

export function asMatchTimeMoves(moves: BoardProps["moves"]): MatchTimeMoves {
  return narrowMoves<MatchTimeMoves>(moves, MATCH_TIME_MOVE_NAMES);
}

/**
 * Dispatches a move, resolving once boardgame.io has taken it.
 *
 * The dispatcher never reports back: it pushes the action into the store and,
 * online, on to a bare `socket.emit` with no acknowledgement. So the only
 * failure it can raise is a throw from the dispatch itself, and turning that
 * into a rejection is what lets one `.catch` cover the call.
 */
function dispatch(run: () => void): Promise<void> {
  try {
    run();
  } catch (e: unknown) {
    return Promise.reject(e instanceof Error ? e : new Error(String(e)));
  }
  return Promise.resolve();
}

/**
 * As `dispatch`, for an action a team cannot afford to lose in silence.
 *
 * With the socket down, socket.io buffers the emit and drops it if the
 * reconnect fails — the move is gone and nothing says so. The dispatch still
 * happens, because the buffer may yet deliver it and refusing to send would
 * cost a team the answer outright on a flag we do not control; but the promise
 * rejects, so the board can tell them to check and send again.
 *
 * A single-player build has no socket to lose, and boardgame.io leaves
 * `isConnected` false there, hence the `isMultiplayer` guard.
 */
function dispatchOrWarn(run: () => void, connection: MatchConnection): Promise<void> {
  return dispatch(run).then(() => {
    if (connection.isMultiplayer && !connection.isConnected) {
      throw new Error(i18n.t("error.disconnected"));
    }
  });
}

/**
 * The match actions every `ClientRepository` shares.
 *
 * They behave the same in every build: what differs between online and offline
 * is where the match runs, and boardgame.io has already absorbed that by the
 * time a move is dispatched. So the implementations inherit these rather than
 * each carrying its own copy of the same three bodies.
 */
export abstract class MatchMoveDispatch {
  submitRelayAnswer(answer: number, moves: RelayMoves, connection: MatchConnection): Promise<void> {
    return dispatchOrWarn(() => moves.submitAnswer(answer), connection);
  }

  // Unlike startRelay, which moves the team to the relay page, this dispatches
  // the opening move of the match once the board is up.
  startRelayGame(moves: RelayMoves, connection: MatchConnection): Promise<void> {
    return dispatchOrWarn(() => moves.startGame(), connection);
  }

  // The timer poll comes round again a second later, so a sync lost to a
  // dropped socket costs nothing — and warning about it every tick would bury
  // the warnings that do matter.
  syncMatchTime(moves: MatchTimeMoves): Promise<void> {
    return dispatch(() => moves.getTime());
  }
}
