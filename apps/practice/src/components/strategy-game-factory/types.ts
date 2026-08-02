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

// Mid-turn UI state a BoardClient needs to remember (which pile is selected,
// which slot is being edited). Moves never see this: they express turn state
// through `nextTurnState` in their returned MoveOutcome.
export interface Events {
  setTurnState: (state: unknown) => void
}

// Everything a move can cause, expressed as data: the engine interprets what
// the move returns, so a move never reaches out and changes anything itself.
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
// A move is a pure reducer: board in, outcome out. It gets no `events`, so
// purity is enforced by the type system rather than by convention — which is
// what lets the same function run in a future authoritative server.
export type PureMoveFunction<TBoard> = (
  board: TBoard, meta: { ctx: Ctx }, ...args: any[]
) => MoveOutcome<TBoard>
// Pure, side-effect-free legality predicate for a single move, colocated with
// its `apply`. Because it depends only on `board` + `ctx` (no React), the same
// function drives the UI (button `disabled`), the engine (illegal-move
// enforcement) and, in the future, an authoritative server-side check.
type MoveValidator<TBoard> = (
  board: TBoard, meta: { ctx: Ctx }, ...args: any[]
) => boolean
export type MoveDefinition<TBoard> = {
  apply: PureMoveFunction<TBoard>
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
