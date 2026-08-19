import type { Ctx } from '../types';
import type { CoreState } from './store';

// Derives the ctx games see from the authoritative CoreState, fresh at every
// use, so there is no cached ctx to go stale.
//
// The fields are listed out rather than spread from `state` on purpose: this is
// the allow-list defining the public ctx surface. `{ ...state }` would also hand
// games `board` (a second source of truth competing with the board threaded
// through moves), the raw `mode` (only the derived `isHumanVsHumanGame` is
// public), and `undoSnapshot`/`currentTurnHasMoves` — engine bookkeeping that
// would silently become API.
export const buildCtx = <TBoard, TTurnState>(
  state: CoreState<TBoard, TTurnState>, resolvedPlayerNames: [string, string]
): Ctx<TTurnState> => ({
  isHumanVsHumanGame: state.mode === 'vsHuman',
  resolvedPlayerNames,
  chosenRoleIndex: state.chosenRoleIndex,
  phase: state.phase,
  turnState: state.turnState,
  currentPlayer: state.currentPlayer,
  // The null check is not redundant with the seat comparison below: with no
  // role chosen both seats are null and would match, opening the board up.
  isClientMoveAllowed: state.phase === 'play'
    && state.currentPlayer !== null
    && (state.mode === 'vsHuman' || state.currentPlayer === state.chosenRoleIndex),
  winnerIndex: state.winnerIndex,
  moveCount: state.moveCount
});
