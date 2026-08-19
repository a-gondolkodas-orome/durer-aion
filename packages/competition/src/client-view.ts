import type { CoreState } from 'engine';
import type { CompetitionMatchState, Difficulty } from './types';

// The engine core as a team may see it: the play itself, without the host's
// own bookkeeping. undoSnapshot goes because competition play has no undo —
// and it is a second copy of the board on every response; currentTurnHasMoves
// and mode are the shell-host internals that feed it.
type CoreClientView<TBoard, TTurnState> = Pick<
  CoreState<TBoard, TTurnState>,
  'board' | 'phase' | 'currentPlayer' | 'chosenRoleIndex' | 'turnState' | 'moveCount' | 'winnerIndex'
>

// What the v2 GET hands a polling client (Phase 3.2 of
// docs/boardgame-io-replacement-plan.md): everything the shell renders —
// countdown off serverNow/endAt, points and tries, the board and whose turn
// it is. startBoardIndex stays server-side: it is hand-out bookkeeping,
// nothing a client renders.
export type StrategyMatchClientView<TBoard, TTurnState = unknown> = {
  gameId: string
  category: string
  // The client's clock cannot be trusted, so every response carries the
  // server's now next to the deadline and the countdown is their difference.
  serverNow: string
  clock: CompetitionMatchState<TBoard, TTurnState>['clock']
  tally: CompetitionMatchState<TBoard, TTurnState>['tally']
  attempt: {
    difficulty: Difficulty
    roleIndex: number | null
    core: CoreClientView<TBoard, TTurnState>
  } | null
  finished: boolean
}

export const toClientView = <TBoard, TTurnState = unknown>(
  state: CompetitionMatchState<TBoard, TTurnState>,
  serverNow: string
): StrategyMatchClientView<TBoard, TTurnState> => ({
  gameId: state.gameId,
  category: state.category,
  serverNow,
  clock: state.clock,
  tally: state.tally,
  attempt: state.attempt && {
    difficulty: state.attempt.difficulty,
    roleIndex: state.attempt.roleIndex,
    core: {
      board: state.attempt.core.board,
      phase: state.attempt.core.phase,
      currentPlayer: state.attempt.core.currentPlayer,
      chosenRoleIndex: state.attempt.core.chosenRoleIndex,
      turnState: state.attempt.core.turnState,
      moveCount: state.attempt.core.moveCount,
      winnerIndex: state.attempt.core.winnerIndex
    }
  },
  finished: state.finished
});
