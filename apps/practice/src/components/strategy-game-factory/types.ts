import type { I18nString, TranslatableNode } from 'language';

export type Phase = 'roleSelection' | 'play' | 'gameEnd'
export type Mode = 'vsComputer' | 'vsHuman'

// TTurnState names the mid-turn payload only — the engine adds the `| null`
// every turn starts and ends in. See src/components/CLAUDE.md § Pinning the
// turn state.
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
  // Turn passes to the other player. Omitted = further moves follow in the same
  // turn. Ignored when `gameEnd` is present.
  isTurnEnd?: boolean
  // undefined = turnState unchanged; null = cleared; anything else = new value.
  nextTurnState?: TTurnState | null
  // Terminal, naming the winner explicitly (`ctx.currentPlayer!` when the mover
  // wins).
  gameEnd?: { winnerIndex: number }
  // Schedule gameplay.endOfTurnMove after a delay. Ignored when `gameEnd` is
  // present (contradiction; throws in dev).
  autoEndOfTurn?: boolean
}
// A move is a pure reducer: board in, outcome out, handed nothing it could
// cause an effect through — see AGENTS.md § Files in a game folder for why that
// matters beyond this repo.
export type MoveFunction<TBoard, TTurnState = unknown> = (
  board: TBoard, meta: { ctx: Ctx<TTurnState> }, ...args: any[]
) => MoveOutcome<TBoard, TTurnState>
// The single source of truth for a move's legality, colocated with its `apply`
// and free of React so the UI, the engine and a future server can share it.
// See src/components/CLAUDE.md § validate.
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
// Engine-wrapped moves, callable to dispatch. This is the bot's view: no
// `isAllowed`, which would be false throughout its turn anyway.
export type GameMoves<TBoard, TTurnState = unknown> = Record<
  string,
  (board: TBoard, ...args: any[]) => MoveOutcome<TBoard, TTurnState>
>
// The BoardClient's view: the same dispatchers plus `isAllowed(board, ...args)`,
// which is what a `disabled` state should ask. Assignable to GameMoves, so
// helpers shared with a bot keep taking the wider type.
export type ClientGameMoves<TBoard, TTurnState = unknown> = Record<
  string,
  ((board: TBoard, ...args: any[]) => MoveOutcome<TBoard, TTurnState>)
    & { isAllowed: (board: TBoard, ...args: any[]) => boolean }
>
export type StrategyArgs<TBoard, TTurnState = unknown> = {
  board: TBoard
  ctx: Ctx<TTurnState>
}
// A game's `moves` object seen as a type — what a game exports as `Moves`.
type AnyMoves = Record<string, MoveDefinition<any, any>>
// What a move takes beyond the board and the meta object: exactly the tail a
// bot has to supply as `args`.
type MoveArgs<TApply> =
  TApply extends (board: any, meta: any, ...args: infer TArgs) => any ? TArgs : never
// A move a bot wants played, named rather than dispatched. Given the game's
// `Moves` it pins the name and the arguments; given only a union of names (or
// nothing) it still pins the name, leaving `args` unchecked.
export type BotMove<TMoves extends string | AnyMoves = string> =
  TMoves extends string ? { move: TMoves; args?: unknown[] }
  : TMoves extends AnyMoves
    ? { [K in keyof TMoves]: { move: K; args?: MoveArgs<TMoves[K]['apply']> } }[keyof TMoves]
    : never
// A pure function of the position that names what it wants played; the engine
// plays it out (see src/components/CLAUDE.md § Bot contract). Deliberately not
// parameterised over the turn state: a bot is asked again with a fresh `ctx`
// for every move it owes, so it plans a whole turn rather than reading its own
// half-made selection back.
export type BotStrategy<TBoard, TMoves extends string | AnyMoves = string> =
  (args: StrategyArgs<TBoard>) => BotMove<TMoves> | BotMove<TMoves>[]
// Annotating these props is what pins TTurnState for the whole game: the
// factory infers the rest of the config from it.
export type BoardClientProps<TBoard, TTurnState = unknown> =
  StrategyArgs<TBoard, TTurnState> & {
    moves: ClientGameMoves<TBoard, TTurnState>
    // The one path that writes engine state without going through a move,
    // deliberately: a selection is not a move, so it must not bump `moveCount`
    // or take an undo snapshot. Moves return `nextTurnState` instead.
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
  // Stable slug this variant is addressable by in the URL (`?variant=3-5-7`).
  // Optional — without one a variant is addressed by its index, which no
  // reordering survives. See src/components/CLAUDE.md § Variants.
  id?: string
  label?: I18nString
  isDefault?: boolean
  generateStartBoard?: () => TBoard
  // A curated list of start boards, in place of generating one: the variant
  // plays a random entry. Its order is part of the contract — see
  // src/components/CLAUDE.md § Curated start boards.
  startBoards?: TBoard[]
  botStrategy?: BotStrategy<TBoard>
  notAlwaysOptimal?: boolean
  // Optional per-variant rule text. Falls back to `presentation.rule` when
  // omitted — used when sibling games are merged into one game whose variants
  // differ only in their rule wording (e.g. board size / coin values).
  rule?: TranslatableNode
}
