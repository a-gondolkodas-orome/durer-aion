import type { Mode, Phase } from '../types';

// The engine's authoritative game state, held OUTSIDE React. Bots and chained
// dispatches (setTimeout closures) read and write it synchronously through the
// store, so they can never observe a stale snapshot — the root cause behind
// the old board-threading convention and the ctxRef per-field shadow.
// This module is framework-free (no React import): together with reducer.ts
// and build-ctx.ts it is the seed of the headless engine a future
// server-authoritative competition mode needs (issue #313).
export type CoreState<TBoard, TTurnState = unknown> = {
  board: TBoard
  phase: Phase
  mode: Mode
  currentPlayer: number | null
  chosenRoleIndex: number | null
  turnState: TTurnState | null
  moveCount: number
  winnerIndex: number | null
  undoSnapshot: { board: TBoard; currentPlayer: number; moveCount: number } | null
  // whether the current turn already has moves (drives the undo snapshot)
  currentTurnHasMoves: boolean
}

export const createInitialCoreState = <TBoard, TTurnState = unknown>(
  board: TBoard, mode: Mode = 'vsComputer'
): CoreState<TBoard, TTurnState> => ({
  board,
  phase: 'roleSelection',
  mode,
  currentPlayer: null,
  chosenRoleIndex: null,
  turnState: null,
  moveCount: 0,
  winnerIndex: null,
  undoSnapshot: null,
  currentTurnHasMoves: false
});

type GameStore<TBoard, TTurnState = unknown> = {
  getState: () => CoreState<TBoard, TTurnState>
  setState: (patch: Partial<CoreState<TBoard, TTurnState>>) => void
  subscribe: (listener: () => void) => () => void
}

// Minimal hand-rolled store: getState returns the same object between writes
// (a requirement of useSyncExternalStore), setState merges a partial patch and
// notifies subscribers synchronously.
export const createGameStore = <TBoard, TTurnState = unknown>(
  initial: CoreState<TBoard, TTurnState>
): GameStore<TBoard, TTurnState> => {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    }
  };
};
