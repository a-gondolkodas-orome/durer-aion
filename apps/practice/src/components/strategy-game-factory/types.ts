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

// Everything a move can cause, expressed as data. Returned by outcome-returning
// (`apply`) moves and interpreted by the engine; legacy (`legacyApply`) moves
// return only `nextBoard`/`autoEndOfTurn` and cause the rest through `events`.
export type MoveOutcome<TBoard> = {
  nextBoard: TBoard
  // Turn passes to the other player. Omitted/false = turn continues (mid-turn
  // move of a multi-phase turn). Ignored when `gameEnd` is present.
  isTurnEnd?: boolean
  // undefined = turnState unchanged; null = cleared; anything else = new value.
  nextTurnState?: unknown
  // Terminal: the game is over. The winner is always explicit — there is no
  // "omitted = mover wins" shorthand in this contract.
  gameEnd?: { winnerIndex: number }
  // Schedule gameplay.endOfTurnMove after a delay. Ignored when `gameEnd` is
  // present (contradiction; throws in dev).
  autoEndOfTurn?: boolean
}
export type MoveResult<TBoard> = Pick<MoveOutcome<TBoard>, 'nextBoard' | 'autoEndOfTurn'>
export type MoveFunction<TBoard> = (
  board: TBoard, meta: { ctx: Ctx; events: Events }, ...args: any[]
) => MoveResult<TBoard>
// Outcome-returning apply: no `events` param, so purity is enforced by the
// type system — everything the move causes is in the returned MoveOutcome.
export type PureMoveFunction<TBoard> = (
  board: TBoard, meta: { ctx: Ctx }, ...args: any[]
) => MoveOutcome<TBoard>
// Pure, side-effect-free legality predicate for a single move, colocated with
// its `apply`/`legacyApply` in the long-form move definition. Because it depends only on
// `board` + `ctx` (no React, no `events`), the same function drives the UI
// (button `disabled`), the engine (illegal-move enforcement) and, in the
// future, an authoritative server-side check.
type MoveValidator<TBoard> = (
  board: TBoard, meta: { ctx: Ctx }, ...args: any[]
) => boolean
// A move is either a legacy plain function (shorthand — always accepted by the
// engine), a long-form `legacyApply` object pairing it with an optional
// legality validator, or — the preferred contract for new games — an
// outcome-returning `apply` that gets no `events` and instead returns
// turn/game consequences as data. The distinct key is the contract marker: the
// engine interprets the returned MoveOutcome only for `apply` moves, and a
// migrated move that still touches `events` fails to compile.
export type MoveDefinition<TBoard> =
  | MoveFunction<TBoard>
  | { legacyApply: MoveFunction<TBoard>; validate?: MoveValidator<TBoard> }
  | { apply: PureMoveFunction<TBoard>; validate?: MoveValidator<TBoard> }
// Engine-internal normalized move shape (not re-exported from the barrel):
// the shorthand folded into long form, carrying exactly one of
// apply/legacyApply (enforced at factory time).
export type NormalizedMove<TBoard> = {
  legacyApply?: MoveFunction<TBoard>
  apply?: PureMoveFunction<TBoard>
  validate?: MoveValidator<TBoard>
}
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
  ((board: TBoard, ...args: any[]) => MoveOutcome<TBoard>)
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
