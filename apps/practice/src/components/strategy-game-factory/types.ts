import type { I18nString, TranslatableNode } from '../../language';

export type Phase = 'roleSelection' | 'play' | 'gameEnd'
export type Mode = 'vsComputer' | 'vsHuman'

// TTurnState is the game's own mid-turn state — the half-made selection a
// multi-stage turn carries between its moves. It names the payload only: the
// engine adds the `| null` that every turn starts and ends in, so a game never
// has to spell it out. Left unpinned it is `unknown`, and reading `turnState`
// then needs a cast, exactly as it did before the parameter existed.
export interface Ctx<TTurnState = unknown> {
  isHumanVsHumanGame: boolean
  resolvedPlayerNames: [string, string]
  chosenRoleIndex: number | null
  phase: Phase
  turnState: TTurnState | null
  currentPlayer: number | null
  isClientMoveAllowed: boolean
  winnerIndex: number | null
  moveCount: number
}

// Everything a move can cause, expressed as data: the engine interprets what
// the move returns, so a move never reaches out and changes anything itself.
export type MoveOutcome<TBoard, TTurnState = unknown> = {
  nextBoard: TBoard
  // Turn passes to the other player. Omitted/false = turn continues (mid-turn
  // move of a multi-phase turn). Ignored when `gameEnd` is present.
  isTurnEnd?: boolean
  // undefined = turnState unchanged; null = cleared; anything else = new value.
  nextTurnState?: TTurnState | null
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
export type MoveFunction<TBoard, TTurnState = unknown> = (
  board: TBoard, meta: { ctx: Ctx<TTurnState> }, ...args: any[]
) => MoveOutcome<TBoard, TTurnState>
// Pure, side-effect-free legality predicate for a single move, colocated with
// its `apply`. Because it depends only on `board` + `ctx` (no React), the same
// function drives the UI (button `disabled`), the engine (illegal-move
// enforcement) and, in the future, an authoritative server-side check.
type MoveValidator<TBoard, TTurnState = unknown> = (
  board: TBoard, meta: { ctx: Ctx<TTurnState> }, ...args: any[]
) => boolean
export type MoveDefinition<TBoard, TTurnState = unknown> = {
  apply: MoveFunction<TBoard, TTurnState>
  validate?: MoveValidator<TBoard, TTurnState>
}
export interface Gameplay<TBoard, TTurnState = unknown> {
  moves: Record<string, MoveDefinition<TBoard, TTurnState>>
  // move name auto-executed (after a delay) following moves returning autoEndOfTurn: true
  endOfTurnMove?: string
}
// Engine-wrapped moves, callable to dispatch. This is the bot's view: a bot
// enumerates legal moves through the raw `validate`/its own helpers, because
// `isAllowed` would be false throughout its turn anyway (see below).
export type GameMoves<TBoard, TTurnState = unknown> = Record<
  string,
  (board: TBoard, ...args: any[]) => MoveOutcome<TBoard, TTurnState>
>
// The BoardClient's view: the same dispatchers, plus `isAllowed(board, ...args)`
// on every move — `ctx.isClientMoveAllowed` (turn ownership) AND the move's
// `validate`, with `ctx` already bound. That is what a `disabled` state should
// ask; the same check silently gates every client dispatch, so handlers need no
// `if (!allowed) return` guards. Assignable to GameMoves, so helpers shared with
// a bot keep taking the wider type.
export type ClientGameMoves<TBoard, TTurnState = unknown> = Record<
  string,
  ((board: TBoard, ...args: any[]) => MoveOutcome<TBoard, TTurnState>)
    & { isAllowed: (board: TBoard, ...args: any[]) => boolean }
>
export type StrategyArgs<TBoard, TTurnState = unknown> = {
  board: TBoard
  ctx: Ctx<TTurnState>
}
// A game's `moves` object seen as a type — what a game exports as `Moves` so
// its bots can name moves out of it.
type AnyMoves = Record<string, MoveDefinition<any, any>>
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
// Deliberately not parameterised over the turn state: a bot is asked again with
// a fresh `ctx` for every move it owes, so it plans a whole turn rather than
// reading its own half-made selection back — the one consumer `turnState` has
// no client for. A bot that ever needs it reads `unknown` and casts.
export type BotStrategy<TBoard, TMoves extends string | AnyMoves = string> =
  (args: StrategyArgs<TBoard>) => BotMove<TMoves> | BotMove<TMoves>[]
// A game pins TTurnState by annotating its BoardClient — `BoardClientProps<Board,
// TurnState>` — and the factory infers the rest of the config from it, so
// `ctx.turnState` and `setTurnState` are typed with no cast anywhere.
export type BoardClientProps<TBoard, TTurnState = unknown> =
  StrategyArgs<TBoard, TTurnState> & {
    moves: ClientGameMoves<TBoard, TTurnState>
    // Writes the mid-turn UI state a BoardClient needs to remember (which pile is
    // selected, which slot is being edited), read back as `ctx.turnState`. The one
    // path that writes engine state without going through a move: a selection is
    // not a move, so it must not bump `moveCount` or take an undo snapshot. Moves
    // never get this — they return `nextTurnState` in their MoveOutcome instead.
    setTurnState: (state: TTurnState | null) => void
  }

// What the variant chooser and the game-end dialog render: a projection of the
// configured variants, deliberately free of the game's own types. It carries
// *whether* a variant has a bot rather than the bot itself — the display never
// calls one, and an opaque `botStrategy?: unknown` field is what forced every
// consumer to guess what it was holding.
export interface Variant {
  originalIndex: number
  disabled?: boolean
  label?: I18nString
  hasBotStrategy: boolean
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
