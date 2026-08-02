import { cloneDeep } from 'lodash';
import type { MoveOutcome, MoveDefinition } from '../types';
import { buildCtx } from './build-ctx';
import type { CoreState } from './store';

export type MoveTransition<TBoard> = {
  state: CoreState<TBoard>
  // validate rejected the dispatch; state is unchanged (same reference)
  illegal?: boolean
  // the shell should schedule gameplay.endOfTurnMove
  autoEndOfTurn?: boolean
  // the shell should run its game-end side effects (dialog, stats, analytics)
  gameJustEnded?: { winnerIndex: number }
  // what the dispatcher (bot / BoardClient) receives back
  result: MoveOutcome<TBoard>
}

// Framework-free move interpreter: validate + apply + fold the consequences
// into the next CoreState. Pure — the React shell decides what to do with the
// returned transition (store write, dialog, timers).
export const reduceMove = <TBoard>(
  state: CoreState<TBoard>,
  def: MoveDefinition<TBoard>,
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
  let gameJustEnded: { winnerIndex: number } | undefined;
  const result: MoveOutcome<TBoard> = def.apply(state.board, { ctx }, ...args);
  if (result.nextTurnState !== undefined) {
    next.turnState = result.nextTurnState;
  }
  if (result.gameEnd) {
    if (import.meta.env.DEV && (result.isTurnEnd || result.autoEndOfTurn)) {
      throw new Error(`strategyGameFactory: move ${name} returned gameEnd `
        + 'together with isTurnEnd/autoEndOfTurn');
    }
    next.phase = 'gameEnd';
    next.winnerIndex = result.gameEnd.winnerIndex;
    gameJustEnded = { winnerIndex: result.gameEnd.winnerIndex };
  } else if (result.isTurnEnd) {
    next.currentTurnHasMoves = false;
    next.currentPlayer = 1 - next.currentPlayer!;
  }
  next.board = result.nextBoard;
  next.moveCount = state.moveCount + 1;
  return {
    state: next,
    result,
    gameJustEnded,
    // Nothing runs after the game ends, so gameEnd suppresses the scheduling.
    autoEndOfTurn: !!result.autoEndOfTurn && !result.gameEnd
  };
};
