# Game and engine authoring

Loaded when working under `src/components/` — the games in `games/` and the
`strategy-game-factory` engine they are built on. Project-wide context (what
this project is, testing policy, styling, i18n, PR conventions) lives in
`AGENTS.md` at the repo root.

## Adding a new game

Follow the steps in [README.md § Adding a new
game](../../README.md#adding-a-new-game). Use `strategyGameFactory` (see
`strategy-game-factory.tsx`) — copy a similar existing game as a starting point.

### strategyGameFactory API

Required params: `presentation`, `BoardClient`, `gameplay`, `variants`.

```typescript
strategyGameFactory({
  presentation: {
    rule,                      // i18n rules text shown in collapsible section
    roleLabels?,               // optional: [{ hu, en }, { hu, en }] — defaults to "1st/2nd player"
    getPlayerStepDescription,  // ({ board, ctx }) => { hu, en } — shown as turn instruction
  },
  BoardClient,                 // React component receiving { board, ctx, moves, setTurnState }
  gameplay: {
    moves,                     // { [name]: { apply, validate? } } — see below
    endOfTurnMove?,            // optional move name auto-executed after moves with autoEndOfTurn: true
  },
  variants,                    // see below
})
```

**`variants`** — array of `{ botStrategy?, generateStartBoard?, label?,
isDefault? }`. The default variant (marked `isDefault: true`, or the only entry
if there is just one) must define `generateStartBoard`. If `botStrategy` is
omitted on a variant, the default variant's `botStrategy` is used as fallback.
If multiple variants are provided, exactly one must be `isDefault: true`. A
single-entry array needs no `isDefault` flag.

**`moves`** — every move is `{ apply, validate? }`: an optional legality
predicate paired with an outcome-returning
`(board, { ctx }, ...args) => MoveOutcome`. A move is handed nothing it could
cause an effect through — everything it causes is data in the returned
`MoveOutcome`:
`{ nextBoard, isTurnEnd?, nextTurnState?, gameEnd?, autoEndOfTurn? }`.
`isTurnEnd: true` passes the turn (omitted = further moves follow in the same
turn); `gameEnd: { winnerIndex }` ends the game with an always-explicit winner
(`ctx.currentPlayer!` when the mover wins) and never flips `currentPlayer` —
`isTurnEnd`/`autoEndOfTurn` alongside it are a dev-mode error;
`nextTurnState` sets `ctx.turnState` (`null` clears, omitted keeps);
`autoEndOfTurn: true` schedules `endOfTurnMove`. Causing nothing directly is
what makes a move a pure reducer, and what lets the same function run in a
future authoritative competition server (see issue #313).

Always pass the current `board` as first arg when chaining moves within a turn.
`apply` does not validate its arguments — it applies them blindly; legality is
enforced by `validate` (below) and/or the `BoardClient`'s `disabled` gating.

**`validate`** (optional, per move) — a pure, side-effect-free legality predicate
`(board, { ctx }, ...args) => boolean` sitting right next to its `apply`. When
present, the engine rejects any dispatch whose args fail it (in dev it throws
loudly to surface the bug; in prod it warns, fires an `illegal-move` analytics
event, and no-ops so a stray call cannot corrupt the board). Omitting it means
"always legal", so this is fully opt-in and moves whose legality is trivial
simply leave it out. The validator is the **single source of truth** for
legality: it drives the engine's enforcement, and — being React-free — a
possible future server-side authoritative check can reuse the same predicate.
Do **not** put the "whose turn is it" check (`ctx.isClientMoveAllowed`) inside
`validate`; the engine folds that in for the client (below). The engine hands
out two wrappings of the same moves: the `moves` object the `BoardClient`
receives **silently ignores** any dispatch that fails `isAllowed` (so a stray
click — even on a button a browser failed to disable — is a harmless no-op),
while bot and auto `endOfTurnMove` dispatches are checked against `validate`
alone and fail loudly (dev: throw; prod: warn + `illegal-move` analytics event
+ no-op), since there an illegal move is a bug. See `coins-in-3-piles`
(two-phase turn) and `cube-coloring` (reuses the existing `isAllowedStep`
helper) for examples.

Both halves take `(board, { ctx }, ...args)`, and the meta slot sits *before* the
game-specific args, so it has to be written even when the move ignores it. Write
it `_` then — `validate: (board: Board, _, cell: number) => …` — and `_board`
when it is the board that goes unread instead. This is the repo-wide rule for
unused parameters (AGENTS.md § Unused parameters); ESLint enforces it.

**`moves.<name>.isAllowed(board, ...args)`** — exposed on every move of the
`BoardClient`'s wrapped `moves` object: `ctx.isClientMoveAllowed` (turn
ownership) AND the move's `validate` (when defined), with `ctx` already bound.
Drive button `disabled` state with it. Because the engine applies the same
check to every client dispatch, click handlers need no `if (!allowed) return`
guards — keep one only when the handler couples local UI state to a successful
move (see `cube-coloring`'s colour-selection reset). Not for bots: a bot is
handed no move wrappers at all (see the bot contract below), so it enumerates
legal moves via the raw `validate`/helpers instead.

**Bot contract** — a `botStrategy` is a pure function of the position,
`({ board, ctx }) => BotMove | BotMove[]`, where a `BotMove` is
`{ move: string, args?: unknown[] }`. It **names** the move it wants rather than
playing it: no move wrappers, no board to thread, no `setTimeout`. Naming a
whole turn at once is the right shape when the turn is one decision made of
several moves (`pile-splitter`: discard a pile, split another; `magic-box`:
place a stone, designate a line); naming one move and being asked again with
the updated `board`/`ctx` is equally fine (`take-and-point`). The engine plays
the named moves out — with `stepDelay()` (`engine/timing.ts`) between them in
the browser so the bot appears to think, immediately in a headless match — and
asks the strategy again while the turn is still its own. Naming a move after the
turn ended is a bug (dev: throw); naming moves the game-winning move made moot
is fine (they are dropped).

Two hosts play a named turn out: the browser shell in
`strategy-game-factory.tsx` and the headless runner in `engine/run-match.ts`.
They differ deliberately in pacing and in how loudly they complain — a bad
strategy must not crash the site in production, while headless it should throw
— but *which* moves land has to be identical.
`engine/bot-turn-agreement.spec.tsx` plays the same turn through both and
compares, so the two cannot drift apart on what counts as a bug.

Left unpinned, `BotMove` is `{ move: string, args?: unknown[] }`, so neither a
mistyped name nor wrong arguments surface until the bot plays the move (dev:
throw). A game pins both by exporting its moves as a type, next to the moves
themselves:

```ts
// gameplay.ts, under the moves object
export type Moves = typeof moves;

// bot-strategy.ts
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => ({ move: 'removeLine', args: [choice] });
```

`BotStrategy<Board, Moves>` derives the move names **and** each move's argument
list from `apply`, so a typo, a wrong arity and a wrong argument type are all
typecheck errors at the bot that made them. A helper that builds a turn's moves
takes the same parameter: `BotMove<Moves>[]` (see `coins-in-3-piles`'s
`asTurn`).

The argument half is only as precise as `apply`'s signature — an unannotated
parameter there types as `any` and silently checks nothing, so annotate them.
`BotStrategy<Board>` (or a bare name union) still works and pins nothing beyond
the name; a game that has not been converted yet keeps compiling.

**`ctx`** fields available in moves and `BoardClient`:
- `currentPlayer`: 0/1 — use this for game logic in both modes
- `isClientMoveAllowed`: boolean — guard all player interactions with this
- `isHumanVsHumanGame`: boolean — branch mode-specific rendering if needed
- `chosenRoleIndex`: null/0/1 — only meaningful in vsComputer mode
- `turnState`: use for multi-stage turns or other state that needs to be
  remembered during a turn if needed, i.e. to expose it from BoardClient to
  getPlayerStepDescription

**Pinning the turn state.** Left unpinned, `ctx.turnState` is `unknown`, and
every reader casts. A multi-stage game names the shape instead, next to the
moves that produce it:

```ts
// gameplay.ts — the payload only; the engine adds the `| null` every turn
// starts and ends in
export type TurnState = { firstSelectedPile: number };
```

```tsx
// board-client.tsx — annotating the props is what pins the whole game
const BoardClient = ({ ctx, setTurnState }: BoardClientProps<Board, TurnState>) => {
  const { turnState } = ctx;   // TurnState | null, no cast
```

The factory infers `TTurnState` from the config, so the game file's
`getPlayerStepDescription` takes `StrategyArgs<Board, TurnState>`, each move's
meta takes `{ ctx: Ctx<TurnState> }` and its `apply` returns
`MoveOutcome<Board, TurnState>` — annotate all of them, since inference reads
every one of those sites and a leftover bare `Ctx` contradicts the rest. A spec
that builds a ctx names it too: `makeCtx<TurnState>({ … })`. Games with no
mid-turn state say nothing and keep compiling.

Bots are deliberately left out: a bot is asked again with a fresh `ctx` for
every move it still owes, so it plans a whole turn rather than reading its own
half-made selection back. `BotStrategy` therefore stays
`BotStrategy<Board, Moves>` and sees `turnState` as `unknown`.

**`setTurnState(stage)`** — a `BoardClient`-only prop, for components that keep
mid-turn UI state in `ctx.turnState`. It is the one path that writes engine
state without going through a move, deliberately: a selection is not a move, so
it must not bump `moveCount` or take an undo snapshot. Moves never get it; they
return `nextTurnState` instead.

**`useMoveScopedState(ctx.moveCount, initial)`** — for a `BoardClient`'s own
mid-turn UI state: a half-made selection, a pending set of removals. The value
is stamped with the `moveCount` at which it was set and exposed only while that
stamp holds, so any move discards it during the next render.

Do not clear such state with `useEffect(() => setX(initial), [ctx.moveCount])`.
That repairs it one render too late — the browser paints a frame with the old
selection over the advanced board — and it is a reset every component has to
remember rather than a property of the state itself.

```tsx
const [selectedCell, setSelectedCell] = useMoveScopedState<number | null>(ctx.moveCount, null);
```

Two things to get right: `initial` is handed back on every stale render, so a
non-primitive must be one stable reference (hoist it to module scope, never
`[]` inline); and mid-turn state the *engine* has to see — anything
`getPlayerStepDescription` reads — belongs in `ctx.turnState` instead, since
this hook is local to the component.

`useHoverPreview(ctx.moveCount)` is this hook plus pointer/focus plumbing, so
board previews get the same invalidation for free.

**`useDeferredMove(ctx.moveCount)`** — for a `BoardClient` whose single click
submits a whole turn made of two moves (`pile-splitter`, `three-piles-rebuild`).
Dispatch the first move, then hand the second to the returned function: it plays
a `STEP_DELAY` later, so the board reads as two actions rather than one jump —
the same beat the engine gives a bot's multi-move turn.

Do not schedule that beat with a bare `setTimeout`. The callback closes over the
board the first move produced, so a restart, a variant switch or an undo inside
the window fires the move at a position that is gone — in dev that throws
"stale board passed to move". The hook cancels on all of those (they rewind
`moveCount`) and on unmount.

```tsx
const deferMove = useDeferredMove(ctx.moveCount);

const clickPiece = ({ pileId, pieceId }: Piece) => {
  const { nextBoard } = moves.removePile(board, 1 - pileId);
  deferMove(() => moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 }));
};
```

### Game state architecture: synchronous store outside React

Authoritative game state (`board`, `phase`, `currentPlayer`, `turnState`,
`moveCount`, …) lives in a small synchronous store outside React
(`strategy-game-factory/engine/store.ts`); the factory component subscribes via
`useSyncExternalStore` and renders snapshots of it. Every dispatch — from the
`BoardClient`, a bot, or the auto `endOfTurnMove` — is validated and applied by
a framework-free reducer (`engine/reducer.ts`)
against `store.getState()`, so bots and chained `setTimeout` dispatches can
never observe a stale render snapshot. Validators may depend on **any** `ctx`
field (`turnState`, `moveCount`, …); `ctx` is always derived fresh from the
store (`engine/build-ctx.ts`). This boardgame.io-style architecture replaced
the earlier per-field workarounds (a render-synced `ctxRef` shadow) that made
staleness a reviewable hazard.

Two conventions to keep in mind:

- **`board` threading stays the public API shape**: always pass the latest
  `nextBoard` when chaining moves within a turn. The store board is
  authoritative regardless — in dev the engine **throws** on a mismatch
  ("stale board passed to move …", converting a chaining bug into a loud,
  located error), in prod the store board silently wins. The argument stays
  because it keeps a move a pure function of its inputs, callable on
  hypothetical boards outside a live game — bot look-ahead and specs both do
  that.
- The `engine/` modules are React-free by design — they are the seed of the
  headless engine a future server-authoritative competition mode needs (see
  issue #313). Don't import React (or
  anything React-flavoured) there; ESLint enforces it, as it does for each
  game's `gameplay.ts`.

Note "boardgame.io-style" means the architecture only. **Do not propose
adopting boardgame.io itself**: it is a good library but effectively
unmaintained (no meaningful releases for years, and its React client pins
React versions well behind the one used here). Borrow its ideas — the
long-form move shape and the external store already do — and build the rest
in-repo.

### New game checklist

- Game works correctly in both `vsComputer` and `vsHuman` mode
- Starting positions representative of the game's complexity; each player wins
  with ~50% probability across random starting boards
- Player cannot win with a non-winning strategy (i.e. AI is truly optimal)
- Any precomputed move table ships with its generator in
  `scripts/pre-generate-ai-moves/`, and re-running it reproduces the committed
  file
- Board type, start boards and moves live in a React-free `gameplay.ts`
- Moves return their consequences rather than causing them (see
  `five-connected-fields`, `coins-in-3-piles`, `hunyadi-and-the-janissaries`)
- Moves with non-trivial legality define `validate` (single source of truth for
  the engine, the `BoardClient`'s `disabled` state and the bot)
- Clear what the player should do next (`getPlayerStepDescription`)
- Interactions disabled during the other player's turn (`ctx.isClientMoveAllowed`)
- Mobile-friendly and keyboard-navigable
- Player can undo within a multi-move turn where that applies
- Neither `board` nor `ctx` is ever modified in place
- Watching the bot play does not give the winning strategy away outright
- The bot names its moves and schedules nothing: the engine paces multi-move
  turns so the AI appears to "think"

### Bot / variant conventions

These are deliberate design choices — treat them as expected, don't "fix" them:

- **Test bots carry no `notAlwaysOptimal` flag.** Being easy to beat is the whole
  point of a "Test" bot. The `notAlwaysOptimal` flag (which renders the ⓘ marker
  in `game-controls.tsx`) is only for a *smart/optimal* bot that in a few
  positions may fail to punish a mistake.
- **The "Teszt / Test" variant name is intentional** — it means "test your
  understanding of the rules before a real game", matching competition usage. Do
  not rename it to "Easy".
- **A role that always wins regardless of the start board is acceptable** and does
  not violate the ~50/50 win-probability guideline above.
