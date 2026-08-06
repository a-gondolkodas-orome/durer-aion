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
export type StrategyArgs<TBoard> = { board: TBoard; ctx: Ctx }
// A game's `moves` object seen as a type — what a game exports as `Moves` so
// its bots can name moves out of it.
type AnyMoves = Record<string, MoveDefinition<any>>
// What a move takes beyond the board and the meta object: exactly the tail a
// bot has to supply as `args`.
type MoveArgs<TApply> =
  TApply extends (board: any, meta: any, ...args: infer TArgs) => any ? TArgs : never
// A move a bot wants played, named rather than dispatched. Parameterised by the
// game's `Moves` it pins both halves: naming a move the game does not have, or
// passing it the wrong arguments, is a typecheck error at the bot. Given only a
// union of names (or nothing) it still pins the name, leaving `args` unchecked.
export type BotMove<TMoves extends string | AnyMoves = string> =
  TMoves extends string ? { move: TMoves; args?: unknown[] }
  : TMoves extends AnyMoves
    ? { [K in keyof TMoves]: { move: K; args?: MoveArgs<TMoves[K]['apply']> } }[keyof TMoves]
    : never
// A bot is a pure function of the position: it names the move it wants, or the
// whole sequence when the turn is planned as one decision, and the engine plays
// them out — paced in the browser so the bot appears to think, immediately in a
// headless match (engine/run-match.ts). Naming moves rather than dispatching
// them is what keeps a strategy free of timers, of the move wrappers and of any
// board to thread, so the same function can run on an authoritative server.
// If the turn is still the bot's once its moves are played, it is asked again
// (see engine/bot-turn.ts), so naming one move at a time is equally fine.
export type BotStrategy<TBoard, TMoves extends string | AnyMoves = string> =
  (args: StrategyArgs<TBoard>) => BotMove<TMoves> | BotMove<TMoves>[]
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
  botStrategy?: BotStrategy<TBoard>
  notAlwaysOptimal?: boolean
  // Optional per-variant rule text. Falls back to `presentation.rule` when
  // omitted — used when sibling games are merged into one game whose variants
  // differ only in their rule wording (e.g. board size / coin values).
  rule?: TranslatableNode
}
