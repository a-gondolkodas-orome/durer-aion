import type { I18nString, TranslatableNode } from '../../language';

export type Phase = 'roleSelection' | 'play' | 'gameEnd'
export type Mode = 'vsComputer' | 'vsHuman'

export interface Ctx {
  isHumanVsHumanGame: boolean
  resolvedPlayerNames: [string, string]
  chosenRoleIndex: number | null
  phase: Phase
  turnState: unknown
  currentPlayer: number | null
  isClientMoveAllowed: boolean
  winnerIndex: number | null
  moveCount: number
}

export interface Events {
  endTurn: () => void
  endGame: (winnerIndex?: number | null) => void
  setTurnState: (state: unknown) => void
}

export type MoveResult<TBoard> = { nextBoard: TBoard; autoEndOfTurn?: boolean }
export type MoveFunction<TBoard> = (
  board: TBoard, meta: { ctx: Ctx; events: Events }, ...args: any[]
) => MoveResult<TBoard>
// Pure, side-effect-free legality predicate for a single move, colocated with
// its `legacyApply` in the long-form move definition. Because it depends only on
// `board` + `ctx` (no React, no `events`), the same function drives the UI
// (button `disabled`), the engine (illegal-move enforcement) and, in the
// future, an authoritative server-side check.
type MoveValidator<TBoard> = (
  board: TBoard, meta: { ctx: Ctx }, ...args: any[]
) => boolean
// A move is either a plain move function (shorthand — always accepted by the
// engine) or a long-form object pairing it with an optional legality validator.
// The key is named `legacyApply` because this events-based contract is on its
// way out: an outcome-returning replacement lands next, and every remaining
// `legacyApply` is one game still to migrate.
export type MoveDefinition<TBoard> =
  | MoveFunction<TBoard>
  | { legacyApply: MoveFunction<TBoard>; validate?: MoveValidator<TBoard> }
export interface Gameplay<TBoard> {
  moves: Record<string, MoveDefinition<TBoard>>
  // move name auto-executed (after a delay) following moves returning autoEndOfTurn: true
  endOfTurnMove?: string
}
// Engine-wrapped moves as seen by BoardClient and bots: callable to dispatch.
// The BoardClient's copy exposes `isAllowed(board, ...args)` on every move —
// `ctx.isClientMoveAllowed` (turn ownership) AND the move's `validate`, with
// `ctx` already bound — which is what its `disabled` state should ask; the
// same check silently gates every client dispatch, so handlers need no
// `if (!allowed) return` guards. Not for bots: their copy carries no
// `isAllowed` (during the bot's turn `isClientMoveAllowed` is false), so bots
// use the raw `validate`/helpers to enumerate legal moves.
export type GameMoves<TBoard> = Record<
  string,
  ((board: TBoard, ...args: any[]) => MoveResult<TBoard>)
    & { isAllowed?: (board: TBoard, ...args: any[]) => boolean }
>
export type StrategyArgs<TBoard> = { board: TBoard; ctx: Ctx; moves: GameMoves<TBoard> }
export type BoardClientProps<TBoard> = StrategyArgs<TBoard> & { events: Events }

export interface Variant {
  originalIndex: number
  disabled?: boolean
  label?: I18nString
  botStrategy?: unknown
  notAlwaysOptimal?: boolean
}

export interface VariantInput<TBoard> {
  label?: I18nString
  isDefault?: boolean
  generateStartBoard?: () => TBoard
  botStrategy?: (args: StrategyArgs<TBoard>) => void
  notAlwaysOptimal?: boolean
  // Optional per-variant rule text. Falls back to `presentation.rule` when
  // omitted — used when sibling games are merged into one game whose variants
  // differ only in their rule wording (e.g. board size / coin values).
  rule?: TranslatableNode
}
