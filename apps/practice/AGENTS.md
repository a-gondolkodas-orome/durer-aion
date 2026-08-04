# Dürer Games — Project Context

## What this project is

A public, static site (no server, hosted on GitHub Pages) featuring interactive
2-player math games from the **Hungarian Dürer math competition**. Each game is
essentially a math problem with a provably optimal winning strategy. Visitors
can play against the computer (choosing a role) or against another human in the
same browser. The computer plays optimally, so the visitor can only win by also
playing optimally.

The goal is to eventually include all past Dürer competition games. Currently
roughly half are implemented.

## Tech stack

- **React 19** with **React Router 7** — SPA, client-side only
- **Vite** — build tool
- **Tailwind CSS 4** — styling
- **Vitest** + **@testing-library/react** — unit and component tests
- **ESLint** — linting
- **lodash** — utility library; feel free to use lodash functions if it helps readability, it's already used extensively in the project

No backend, no database, no auth. Deployed as a static build to GitHub Pages.

## Architecture

Games live under `src/components/games/`, one folder per game. The game list is
registered in `gameList.ts`.

**Shared infrastructure:**
- `game-parts/` — common UI elements (rules section, role chooser, restart
  button, etc.)
- `strategy-game-factory.tsx` — game flow engine via `strategyGameFactory`: handles
  turn-taking, end-of-game detection, restart/clean state. Defines a
  well-specified API that every game must implement.

**Per-game responsibility:**
Each game folder implements the optimal strategy (computer AI) and game-specific
UI independently, conforming to the `strategyGameFactory` API (role labels,
rules, permissible moves, initial state, etc.). Strategy is implemented however
is simplest: on-the-fly calculation/logic when feasible, or precomputed optimal
moves stored in a JSON file when performance requires it.

Traffic is expected to remain low — no scalability concerns.

## Testing

Any logic change (not just styling) to `strategy-game-factory.tsx` or the overview page
must be covered by new unit tests. Prefer adding tests before or alongside the
change, not as an afterthought.

Game-specific logic is also worth testing when the winning strategy is
non-trivial. Because bots name their moves, a spec can read a decision straight
off the return value (`botNextMoveArgs` in `test-utils`), and `runMatch`
(`strategy-game-factory/engine/run-match.ts`) plays two strategies against each
other through the real moves and the real reducer — no fake `moves` object, no
hand-rolled game loop. That is what turns "the AI is truly optimal" into a test:
the smart bot must win as the mover from a winning start board, and as the
replier from a losing one (see `coins-in-3-piles`, `remove-row-or-column`).

Size the sweep to what the strategy costs. Sweeping every start board is right
for a cheap strategy over a small state space (`coins-in-3-piles`: 124 boards,
~50 ms) and wrong for one that searches (`totem-poles`: ~3 s for a handful of
playouts). For those, play a few representative boards and leave the exhaustive
argument to cheap unit tests of the characterisation itself — the Grundy value,
the parity invariant, the win/loss predicate.

## Planned future directions

### Primary (ongoing)
- **Add remaining Dürer competition games** — the main ongoing effort; goal is
  to cover all past competition games
- **Refactoring and style improvements** — keep the codebase clean, consistent,
  and easy to maintain

## Adding a new game

Follow the steps in [README.md § Adding a new
game](README.md#adding-a-new-game). Use `strategyGameFactory` (see
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
the updated `board`/`ctx` is equally fine (`take-and-point`). The engine
(`engine/bot-turn.ts`) plays the named moves out — with `BOT_STEP_DELAY`
between them in the browser so the bot appears to think, immediately in a
headless match — and asks the strategy again while the turn is still its own.
Naming a move after the turn ended is a bug (dev: throw); naming moves the
game-winning move made moot is fine (they are dropped).

`BotMove.move` is a plain string by default, so a mistyped name only surfaces
when the bot plays it (dev: throw, naming the move names the game does have).
Have the compiler catch it instead by pinning the union to the game's own moves
— worth it wherever the game exports them:

```ts
import type { Board, moves } from './helpers';
type Bot = BotStrategy<Board, keyof typeof moves>;

export const smartBotStrategy: Bot = ({ board }) => ({ move: 'removeLine', args: [choice] });
```

See `remove-row-or-column` and `coins-in-3-piles` (whose `asTurn` helper returns
`BotMove<MoveName>[]`).

**`ctx`** fields available in moves and `BoardClient`:
- `currentPlayer`: 0/1 — use this for game logic in both modes
- `isClientMoveAllowed`: boolean — guard all player interactions with this
- `isHumanVsHumanGame`: boolean — branch mode-specific rendering if needed
- `chosenRoleIndex`: null/0/1 — only meaningful in vsComputer mode
- `turnState`: use for multi-stage turns or other state that needs to be
  remembered during a turn if needed, i.e. to expose it from BoardClient to
  getPlayerStepDescription

**`setTurnState(stage)`** — a `BoardClient`-only prop, for components that keep
mid-turn UI state in `ctx.turnState`. It is the one path that writes engine
state without going through a move, deliberately: a selection is not a move, so
it must not bump `moveCount` or take an undo snapshot. Moves never get it; they
return `nextTurnState` instead.

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
  `docs/real-competitions-plan.md` and issue #313). Don't import React (or
  anything React-flavoured) there.

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

## Dark mode

The site supports dark mode. Use `dark:` Tailwind variants for dark-mode-specific overrides. For card/panel backgrounds, prefer `bg-surface-elevated` (a custom token) over raw color classes — it adapts automatically to both light and dark themes.

## Styling / colours

Keep styling simple and consistent. Use plain Tailwind colour names — `blue`,
`red`, `green`, `slate` — rather than the fancy variants (`sky`, `rose`,
`emerald`, etc.). Only reach for a less common colour when there is a real
reason, such as matching an existing element. Don't introduce colour variety
for its own sake.

## Internationalisation (i18n)

See [README.md § Internationalisation
(i18n)](README.md#internationalisation-i18n). Use the `t()` helper from
`translate.js`.

## Comments

Only write a comment when it explains something that is **not self-evident from
the code itself** — a rule of the game the condition alone doesn't imply, why an
apparently redundant branch exists, a non-obvious invariant, the reasoning behind
a strategy. A comment that restates the line under it is noise; delete it.

```ts
// noise — the code already says exactly this
// The player who takes the last match wins.
if (nextBoard.length === 0) {
  return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
}

// worth keeping — the return value alone doesn't say why there is no game-end branch
// A split never empties the board, so it can only ever end the turn.
return { nextBoard, isTurnEnd: true };
```

This applies with particular force to moves on the outcome-returning `apply`
contract: `gameEnd: { winnerIndex }` already names the winner, so prose
narrating who won earns nothing.

## Pull request size

Reviewer time is the scarcest resource here, so plan the split **before**
starting, not after the diff has grown. Two rules cover most cases:

- **Separate the design from the sweep.** A change to the `strategyGameFactory`
  contract touches every game, but only the engine, the new shape and a pilot
  game or two carry decisions worth reviewing; the rest is mechanical. Land the
  design first with 2–3 games converted, the bulk conversion after.
- **Migrate a contract with a legacy path, not in one commit.** The engine can
  accept the old and new shape at once, which turns "every game must change
  together" into themed batches. This is how the move contract went: #361 added
  the outcome-returning `apply` alongside the old one, ~10 batches migrated the
  games by family, #385 dropped the legacy path. Follow that shape.

A mechanical sweep that follows a merged design PR is fine at any size — it is
skimmable precisely because the pattern was already reviewed.

## Maintenance philosophy

This is a volunteer side-project with limited time. Prefer simple, consistent,
easy-to-maintain code. New games should be straightforward to add by following
the existing pattern. Avoid over-engineering.
