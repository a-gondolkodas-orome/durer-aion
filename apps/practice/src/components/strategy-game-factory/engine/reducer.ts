import { cloneDeep } from 'lodash';
import type { MoveOutcome, MoveDefinition } from '../types';
import { buildCtx } from './build-ctx';
import type { CoreState } from './store';

type MoveTransition<TBoard, TTurnState> = {
  state: CoreState<TBoard, TTurnState>
  // validate rejected the dispatch; state is unchanged (same reference)
  illegal?: boolean
  // the shell should schedule gameplay.endOfTurnMove
  autoEndOfTurn?: boolean
  // the shell should run its game-end side effects (dialog, stats, analytics)
  gameJustEnded?: { winnerIndex: number }
  // what the dispatcher (bot / BoardClient) receives back
  result: MoveOutcome<TBoard, TTurnState>
}

// Framework-free move interpreter: validate + apply + fold the consequences
// into the next CoreState. Pure — the React shell decides what to do with the
// returned transition (store write, dialog, timers).
export const reduceMove = <TBoard, TTurnState>(
  state: CoreState<TBoard, TTurnState>,
  def: MoveDefinition<TBoard, TTurnState>,
  name: string,
  args: unknown[],
  resolvedPlayerNames: [string, string]
): MoveTransition<TBoard, TTurnState> => {
  const ctx = buildCtx(state, resolvedPlayerNames);
  if (def.validate && !def.validate(state.board, { ctx }, ...args)) {
    return { state, illegal: true, result: { nextBoard: state.board } };
  }
  const next: CoreState<TBoard, TTurnState> = { ...state };
  if (!state.currentTurnHasMoves) {
    next.undoSnapshot = {
      board: cloneDeep(state.board),
      currentPlayer: state.currentPlayer!,
      moveCount: state.moveCount
    };
    next.currentTurnHasMoves = true;
  }
  let gameJustEnded: { winnerIndex: number } | undefined;
  const result: MoveOutcome<TBoard, TTurnState> = def.apply(state.board, { ctx }, ...args);
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
