import type { Ctx } from '../types';
import type { CoreState } from './store';

// Derives the ctx games see (moves, validators, BoardClient, bot) from the
// authoritative CoreState. Called fresh at every use, so consumers always see
// current values — there is no cached/stale ctx anywhere anymore.
//
// The fields are listed out rather than spread from `state` on purpose: this is
// the allow-list defining the public ctx surface. `{ ...state }` would also hand
// games `board` (a second source of truth competing with the board threaded
// through moves), the raw `mode` (ctx deliberately exposes only the derived
// `isHumanVsHumanGame`), and `undoSnapshot`/`currentTurnHasMoves` — engine
// bookkeeping that would silently become public API, and that an authoritative
// server must never ship to a client.
export const buildCtx = <TBoard>(
  state: CoreState<TBoard>, resolvedPlayerNames: [string, string]
): Ctx => ({
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
