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

// Everything a move can cause, expressed as data: the engine interprets what
// the move returns, so a move never reaches out and changes anything itself.
export type MoveOutcome<TBoard> = {
  nextBoard: TBoard
  // Turn passes to the other player. Omitted/false = turn continues (mid-turn
  // move of a multi-phase turn). Ignored when `gameEnd` is present.
  isTurnEnd?: boolean
  // undefined = turnState unchanged; null = cleared; anything else = new value.
  nextTurnState?: unknown
  // Terminal: the game is over, naming the winner explicitly (use
  // `ctx.currentPlayer!` when the mover wins).
  gameEnd?: { winnerIndex: number }
  // Schedule gameplay.endOfTurnMove after a delay. Ignored when `gameEnd` is
  // present (contradiction; throws in dev).
  autoEndOfTurn?: boolean
}
// A move is a pure reducer: board in, outcome out. It is handed nothing it
// could cause an effect through, so purity is enforced by the type system
// rather than by convention — which is what lets the same function run in a
// future authoritative server.
export type MoveFunction<TBoard> = (
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
  apply: MoveFunction<TBoard>
  validate?: MoveValidator<TBoard>
}
export interface Gameplay<TBoard> {
  moves: Record<string, MoveDefinition<TBoard>>
  // move name auto-executed (after a delay) following moves returning autoEndOfTurn: true
  endOfTurnMove?: string
}
// Engine-wrapped moves, callable to dispatch. This is the bot's view: a bot
// enumerates legal moves through the raw `validate`/its own helpers, because
// `isAllowed` would be false throughout its turn anyway (see below).
export type GameMoves<TBoard> = Record<
  string,
  (board: TBoard, ...args: any[]) => MoveOutcome<TBoard>
>
// The BoardClient's view: the same dispatchers, plus `isAllowed(board, ...args)`
// on every move — `ctx.isClientMoveAllowed` (turn ownership) AND the move's
// `validate`, with `ctx` already bound. That is what a `disabled` state should
// ask; the same check silently gates every client dispatch, so handlers need no
// `if (!allowed) return` guards. Assignable to GameMoves, so helpers shared with
// a bot keep taking the wider type.
export type ClientGameMoves<TBoard> = Record<
  string,
  ((board: TBoard, ...args: any[]) => MoveOutcome<TBoard>)
    & { isAllowed: (board: TBoard, ...args: any[]) => boolean }
>
export type StrategyArgs<TBoard> = { board: TBoard; ctx: Ctx; moves: GameMoves<TBoard> }
export type BoardClientProps<TBoard> = Omit<StrategyArgs<TBoard>, 'moves'> & {
  moves: ClientGameMoves<TBoard>
  // Writes the mid-turn UI state a BoardClient needs to remember (which pile is
  // selected, which slot is being edited), read back as `ctx.turnState`. The one
  // path that writes engine state without going through a move: a selection is
  // not a move, so it must not bump `moveCount` or take an undo snapshot. Moves
  // never get this — they return `nextTurnState` in their MoveOutcome instead.
  setTurnState: (state: unknown) => void
}

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
