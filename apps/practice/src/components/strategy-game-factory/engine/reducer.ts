import { cloneDeep } from 'lodash';
import type { MoveOutcome, EngineMove } from '../types';
import { buildCtx } from './build-ctx';
import type { CoreState } from './store';

export type MoveTransition<TBoard> = {
  state: CoreState<TBoard>
  // validate rejected the dispatch; state is unchanged (same reference)
  illegal?: boolean
  // the shell should schedule gameplay.endOfTurnMove
  autoEndOfTurn?: boolean
  // the shell should run its game-end side effects (dialog, stats, analytics)
  gameJustEnded?: { winnerIndex: number | null }
  // what the dispatcher (bot / BoardClient) receives back
  result: MoveOutcome<TBoard>
}

// Framework-free move interpreter: validate + apply (either contract) + fold
// the consequences into the next CoreState. Pure — the React shell decides
// what to do with the returned transition (store write, dialog, timers).
export const reduceMove = <TBoard>(
  state: CoreState<TBoard>,
  def: EngineMove<TBoard>,
  name: string,
  args: unknown[],
  resolvedPlayerNames: [string, string]
): MoveTransition<TBoard> => {
  const ctx = buildCtx(state, resolvedPlayerNames);
  if (def.validate && !def.validate(state.board, { ctx }, ...args)) {
    return { state, illegal: true, result: { nextBoard: state.board } };
  }
  const next: CoreState<TBoard> = { ...state };
  if (!state.currentTurnHasMoves) {
    next.undoSnapshot = {
      board: cloneDeep(state.board),
      currentPlayer: state.currentPlayer!,
      moveCount: state.moveCount
    };
    next.currentTurnHasMoves = true;
  }
  let gameJustEnded: { winnerIndex: number | null } | undefined;
  const endTurn = () => {
    next.currentTurnHasMoves = false;
    next.currentPlayer = 1 - next.currentPlayer!;
  };
  const endGame = (winnerIndex?: number | null) => {
    // A bare legacy endGame() credits the mover — the player at MOVE START
    // (state.currentPlayer, not next.currentPlayer: a preceding endTurn() in
    // the same move has already flipped `next`, while today's React setState
    // being asynchronous meant endGame always read the unflipped value).
    const resolvedWinner = winnerIndex ?? state.currentPlayer;
    next.phase = 'gameEnd';
    next.winnerIndex = resolvedWinner;
    gameJustEnded = { winnerIndex: resolvedWinner };
  };
  let result: MoveOutcome<TBoard>;
  if (def.apply) {
    result = def.apply(state.board, { ctx }, ...args);
    if (result.nextTurnState !== undefined) {
      next.turnState = result.nextTurnState;
    }
    if (result.gameEnd) {
      if (import.meta.env.DEV && (result.isTurnEnd || result.autoEndOfTurn)) {
        throw new Error(`strategyGameFactory: move ${name} returned gameEnd `
          + 'together with isTurnEnd/autoEndOfTurn');
      }
      endGame(result.gameEnd.winnerIndex);
    } else if (result.isTurnEnd) {
      endTurn();
    }
  } else {
    // Legacy contract: the move causes transitions by calling events, which
    // here write into `next`. Note endGame(w) followed by endTurn() (a shape a
    // few legacy games have) still flips currentPlayer after gameEnd — inert,
    // and exactly what happened with React state.
    const events = {
      endTurn,
      endGame,
      setTurnState: (turnState: unknown) => { next.turnState = turnState; }
    };
    result = def.legacyApply!(state.board, { ctx, events }, ...args);
  }
  next.board = result.nextBoard;
  next.moveCount = state.moveCount + 1;
  return {
    state: next,
    result,
    gameJustEnded,
    // v2 gameEnd suppresses endOfTurnMove scheduling (nothing runs after the
    // game ends); legacy moves keep their exact pre-store behavior.
    autoEndOfTurn: !!result.autoEndOfTurn && !(def.apply && result.gameEnd)
  };
};
