# Dürer Games — Project Context

## What this project is

A public, static site (no server, hosted on GitHub Pages) featuring interactive
2-player math games from the **Hungarian Dürer math competition**. Each game is
essentially a math problem with a provably optimal winning strategy. Visitors
can play against the computer (choosing a role) or against another human in the
same browser. The computer plays optimally, so the visitor can only win by also
playing optimally.

The goal is to include all past Dürer competition games. Most are implemented
(see `gameList.ts`); what remains is a tail of stragglers plus each new
competition's games as they are held. Traffic is expected to remain low — no
scalability concerns.

## Tech stack

A React SPA, client-side only — see `package.json` for the stack and its pinned
versions. No backend, no database, no auth. Deployed as a static build to
GitHub Pages.

lodash is already used extensively; feel free to reach for it where it helps
readability.

## Architecture

Games live under `src/components/games/`, one folder per game, registered in
`gameList.ts`. Shared infrastructure lives in
`src/components/strategy-game-factory/`, a sibling of `games/`:

- `game-parts/` — common UI elements (rules section, role chooser, restart
  button, etc.)
- `strategy-game-factory.tsx` — the game flow engine: turn-taking, end-of-game
  detection, restart/clean state, and the API every game implements. Games
  import through the barrel (`index.ts`) — no deep imports. The barrel is a
  path alias, so no `../../` either, which is what makes the rule
  self-enforcing.

Each game folder implements the optimal strategy (computer AI) and its own UI
against that API. Strategy is implemented however is simplest: calculated on the
fly where feasible, or precomputed optimal moves in a JSON file where
performance requires it. **A committed table needs its generator committed
too**, in `scripts/pre-generate-ai-moves/` — a table nobody can rebuild is one
nobody can audit or fix when the game changes. Write it so re-running reproduces
the committed file byte for byte, and so it verifies the table before writing
(see `modified-mill-strategy.cjs`).

### Files in a game folder

| File | Holds | React? |
|---|---|---|
| `gameplay.ts` | `Board` type, `generateStartBoard` / `startBoards`, `moves`, `Moves`, and the legality / win-detection helpers they use | **never** |
| `start-boards.ts` | curated `startBoards` lists, once they outgrow `gameplay.ts` (`bacteria`) | **never** |
| `bot-strategy.ts` | `smartBotStrategy`, `randomBotStrategy` and the search or characterisation behind them | never in practice |
| `board-client.tsx` | `BoardClient` (split out once the JSX outgrows the game file) | yes |
| `<game>.tsx` | `rule`, `getPlayerStepDescription`, `variants`, the `strategyGameFactory` call | yes |

`gameplay.ts` is the **framework-free half of a game**: the same module a
server-authoritative competition mode would validate moves with, so it has to
run in plain Node (issue #313). ESLint enforces that — a `react` import, or a
value import from the `strategy-game-factory` barrel, is an error there; types
from the barrel are fine, since `import type` is erased. A game whose gameplay
is a handful of lines still gets the file: uniform layout is what makes the
catalog skimmable, and it is what a spec and the bot's move pinning import
without dragging in JSX.

Two rules keep the boundary meaningful rather than nominal:

- **Presentation does not live in `gameplay.ts`.** Step descriptions, labels and
  rule text belong to the game file even when they happen to contain no JSX.
- **A predicate that exists only to characterise the winning strategy belongs
  with the bot**, not in `gameplay.ts` — competition mode ships the bot
  server-side precisely so it cannot be read out of the bundle. A handful of
  older games derive their random start boards from such a predicate
  (`coins-in-3-piles`'s `isLostForMover`), which keeps it in `gameplay.ts`; that
  is accepted for practice games, where the strategy is readable anyway. A
  **competition** game must not do it — curate its start boards instead.

A variant states its start position either as `generateStartBoard` or as
`startBoards`, a curated list. Prefer the list whenever the positions are
enumerable, and verify each entry with `forcedWinnerIndex` — the contract and
the reasoning are in [src/components/CLAUDE.md § Curated start
boards](src/components/CLAUDE.md#curated-start-boards).

### Where a spec lives

A spec is named after the module whose behaviour it asserts —
`gameplay.spec.ts` for the rules, `bot-strategy.spec.ts` for the strategy,
`<game>.spec.ts` for what the game file itself holds — plus a topical name
(`solver.spec.ts`, `geometry.spec.ts`) where one part of the strategy is worth
testing on its own. What the module *is* decides, not what the test reads along
the way: "the bot only ever produces legal moves" belongs with the bot even
though it checks a rule. What must not happen is moves being tested from
anywhere but `gameplay.spec.ts`.

## Testing

Any logic change (not just styling) to `strategy-game-factory.tsx` or the
overview page must be covered by new unit tests, added before or alongside the
change rather than as an afterthought.

Game-specific logic is also worth testing when the winning strategy is
non-trivial. Because bots name their moves, a spec can read a decision straight
off the return value (`botNextMoveArgs` in `test-utils`, imported as
`from 'test-utils'` — an alias, so no `../../../`), and `runMatch`
(`strategy-game-factory/engine/run-match.ts`) plays two strategies against each
other through the real moves and the real reducer — no fake `moves` object, no
hand-rolled game loop. That is what turns "the AI is truly optimal" into a test:
the smart bot must win as the mover from a winning start board, and as the
replier from a losing one (see `coins-in-3-piles`, `remove-row-or-column`).

Every registered game is already swept once by `games/plays-to-an-end.spec.ts`,
which plays each variant headlessly and asserts only that a match completes and
names a winner. `runMatch` throws on an unknown move, a move the game's own
`validate` rejects, a move named after the turn ended, and a game that never
ends, so a new game gets that much conformance for free. It tests the *game*,
not the bot's judgement, and is kept cheap on purpose: variants whose bot
searches are listed out of it by name (their own bot spec covers them), and the
rest play as many random start boards as a small per-variant time budget allows.

Size the sweep to what the strategy costs: every start board for a cheap
strategy over a small state space (`coins-in-3-piles`: 124 boards, ~50 ms), a
few representative ones for a strategy that searches (`totem-poles`: ~3 s for a
handful of playouts), leaving the exhaustive argument to cheap unit tests of the
characterisation itself — the Grundy value, the parity invariant, the win/loss
predicate.

### Coverage

```bash
npm run coverage         # line coverage, on demand
npm run coverage:unswept # the same, without the two all-games sweeps
npm run coverage:patch   # how much of what a branch adds a spec reaches
```

The first two are **on demand and have no threshold**, and should stay that way.
The two sweeps execute ~94% of the source — that is how much of this repo is
`games/` — while asserting only that a match ends and a board renders, so the
global percentage reads high whatever the tests are worth, and a CI gate on it
would be satisfied by registering another game. What the report is good for is
the question grep cannot answer: which modules **no spec loads at all**, which
is why `coverage.include` in `vite.config.js` names every file under `src/`
rather than only what a test imported. `coverage:unswept` is the other half:
what drops to near zero there is the game logic nothing but a sweep touches.

`coverage:patch` (`scripts/patch-coverage.mjs`, run by the `patch-coverage` job
on every PR) is the one number CI gates on: the lines a branch **adds** to
non-JSX files under `src/`, measured against `coverage:unswept`. Added lines
cannot be diluted by the rest of the repo, so the number means the same thing in
every PR, and excluding the sweeps is what stops `gameList.ts` registration from
reading as coverage. Under 85% fails, diffs under twenty measured lines never
do, and the `skip coverage` label skips the job. Failing means the added logic
is not *unit-tested*, not that it is untested. The bar is a floor under existing
habit, not a stretch above it — recent history sits at 87–96%. A gate on either
of the other two reports would still be wrong for the reasons above; don't add
one.

## Planned future directions

- **Replace `boardgame.io` in `durer-aion` with this engine** — the current main
  effort. `a-gondolkodas-orome/durer-aion` already runs real competitions
  (server-authoritative match state, team identity, timers, results); the plan
  is for `strategyGameFactory` to take over its game-engine slot rather than
  build a competition backend here (issue #313). What this repo owes that effort
  is the engine work they share: a game's rules and its bot each importable with
  no React, which is why `gameplay.ts` and `bot-strategy.ts` are separate files.
- **Add Dürer competition games** — the games of each new competition, plus the
  tail of older ones still missing
- **Refactoring and style improvements** — keep the codebase clean, consistent,
  and easy to maintain

**Do not propose adopting boardgame.io.** The engine deliberately borrows its
ideas — the long-form move shape and the external store already do — but the
library itself is effectively unmaintained (no meaningful releases for years,
and its React client pins React versions well behind the one used here). Build
the rest in-repo.

## Adding a new game

The steps are in [README.md § Adding a new
game](README.md#adding-a-new-game). The `strategyGameFactory` API, the move and
bot contracts, the store architecture and the new-game checklist are in
`src/components/CLAUDE.md`, which loads automatically when working under
`src/components/`; read it directly when discussing that design without opening
a file there.

## Dark mode

The site supports dark mode. Use `dark:` Tailwind variants for dark-mode-specific overrides. For card/panel backgrounds, prefer `bg-surface-elevated` (a custom token) over raw color classes — it adapts automatically to both light and dark themes.

## Styling / colours

Keep styling simple and consistent. Use plain Tailwind colour names — `blue`,
`red`, `green`, `slate` — rather than the fancy variants (`sky`, `rose`,
`emerald`, etc.). Only reach for a less common colour when there is a real
reason, such as matching an existing element. Don't introduce colour variety
for its own sake.

## Internationalisation (i18n)

See [README.md § Internationalisation (i18n)](README.md#internationalisation-i18n).

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

Say a thing once. Rationale that belongs to a rule of the repo lives in the doc
that owns the rule, and the comment points at it (`see AGENTS.md § Testing`)
rather than restating it — otherwise one decision goes stale in a dozen places.

## Unused parameters

A parameter that has to be written but is never read starts with `_`: the `meta`
slot of a move whose `validate` only asks about the board, the value slot of an
`(_, i) => …` callback. A bare `_` is fine when it is the only unused parameter
in the signature; give it a name (`_board`, `_meta`) when a second one would
collide with it, or when the name is worth reading. ESLint enforces this
(`no-unused-vars` with `args: 'all'`).

The rule is about parameters you are *forced* to write. One that is merely
unwanted should be dropped instead — trailing parameters can simply be left off
(`apply: (board: Board) => …`), and an unwanted key is left out of the
destructuring, which is why bots and `getPlayerStepDescription` write
`({ board })` rather than underscoring `ctx`.

## Pull request size

Reviewer time is the scarcest resource here, so plan the split **before**
starting, not after the diff has grown. Two rules cover most cases:

- **Separate the design from the sweep.** A change to the `strategyGameFactory`
  contract touches every game, but only the engine, the new shape and a pilot
  game or two carry decisions worth reviewing; the rest is mechanical. Land the
  design first with 2–3 games converted, the bulk conversion after.
- **Migrate a contract with a legacy path, not in one commit.** The engine can
  accept the old and new shape at once, which turns "every game must change
  together" into themed batches — as the move contract went: add the new shape
  alongside the old, migrate the games by family, then drop the legacy path.

A mechanical sweep that follows a merged design PR is fine at any size — it is
skimmable precisely because the pattern was already reviewed.

## Maintenance philosophy

This is a volunteer side-project with limited time. Prefer simple, consistent,
easy-to-maintain code. New games should be straightforward to add by following
the existing pattern. Avoid over-engineering.
