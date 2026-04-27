# Dürer Games — Project Context

## What this project is

A public, static site (no server, hosted on GitHub Pages) featuring interactive 2-player math games from the **Hungarian Dürer math competition**. Each game is essentially a math problem with a provably optimal winning strategy. Visitors can play against the computer (choosing a role) or against another human in the same browser. The computer plays optimally, so the visitor can only win by also playing optimally.

The goal is to eventually include all past Dürer competition games. Currently roughly half are implemented.

## Tech stack

- **React 19** with **React Router 7** — SPA, client-side only
- **Vite** — build tool
- **Tailwind CSS 4** — styling
- **Vitest** + **@testing-library/react** — unit and component tests
- **ESLint** — linting

No backend, no database, no auth. Deployed as a static build to GitHub Pages.

## Architecture

Games live under `src/components/games/`, one folder per game. The game list is registered in `gameList.js`.

**Shared infrastructure:**
- `game-parts.js` — common UI elements (rules section, role chooser, restart button, etc.)
- `strategy-game.js` — game flow engine via `strategyGameFactory`: handles turn-taking, end-of-game detection, restart/clean state. Defines a well-specified API that every game must implement.

**Per-game responsibility:**
Each game folder implements the optimal strategy (computer AI) and game-specific UI independently, conforming to the `strategyGameFactory` API (role labels, rules, permissible moves, initial state, etc.). Strategy is implemented however is simplest: on-the-fly calculation/logic when feasible, or precomputed optimal moves stored in a JSON file when performance requires it.

Traffic is expected to remain low — no scalability concerns.

## Planned future directions

### Primary (ongoing)
- **Add remaining Dürer competition games** — the main ongoing effort; goal is to cover all past competition games
- **Refactoring and style improvements** — keep the codebase clean, consistent, and easy to maintain

### Secondary (possible, not committed)
- **Multiple difficulty modes** — e.g. computer plays suboptimally so beginners can win

## Adding a new game

Follow the steps in [README.md § Adding a new game](README.md#adding-a-new-game). Use `strategyGameFactory` (see `strategy-game.js`) — copy a similar existing game as a starting point.

### strategyGameFactory API

Required params: `presentation`, `BoardClient`, `gameplay`, `variants`.

```javascript
strategyGameFactory({
  presentation: {
    rule,                      // i18n rules text shown in collapsible section
    title,                     // i18n game title — resolve as: gameList.X.title || gameList.X.name
    credit?,                   // from gameList.X.credit — optional
    roleLabels?,               // optional: [{ hu, en }, { hu, en }] — defaults to "1st/2nd player"
    getPlayerStepDescription,  // ({ board, ctx }) => { hu, en } — shown as turn instruction
  },
  BoardClient,                 // React component receiving { board, ctx, events, moves }
  gameplay: {
    moves,                     // object of move functions: (board, { ctx, events }, ...args) => { nextBoard }
    endOfTurnMove?,            // optional move name auto-executed after moves with autoEndOfTurn: true
  },
  variants,                    // see below
})
```

**`variants`** — array of `{ botStrategy?, generateStartBoard?, label?, isDefault? }`. The default variant (marked `isDefault: true`, or the only entry if there is just one) must define `generateStartBoard`. If `botStrategy` is omitted on a variant, the default variant's `botStrategy` is used as fallback. If multiple variants are provided, exactly one must be `isDefault: true`. A single-entry array needs no `isDefault` flag.

**`moves`** — each move is `(board, { ctx, events }, ...args) => { nextBoard }`. Always pass the current `board` as first arg when chaining moves within a turn.

**`ctx`** fields available in moves and `BoardClient`:
- `currentPlayer`: 0/1 — use this for game logic in both modes
- `isClientMoveAllowed`: boolean — guard all player interactions with this
- `isHumanVsHumanGame`: boolean — branch mode-specific rendering if needed
- `chosenRoleIndex`: null/0/1 — only meaningful in vsComputer mode
- `turnStage`: use for multi-stage turns if needed

**`events`**: `endTurn()`, `endGame({ winnerIndex? })`, `setTurnStage(stage)`.

### New game checklist

- Game works correctly in both `vsComputer` and `vsHuman` mode
- Starting positions representative of the game's complexity
- Player cannot win with a non-winning strategy (i.e. AI is truly optimal)
- Clear what the player should do next (`getPlayerStepDescription`)
- Interactions disabled during the other player's turn (`ctx.isClientMoveAllowed`)
- Mobile-friendly and keyboard-navigable
- Player can undo within multi-move turns if applicable
- No console errors/warnings (e.g. missing React keys)
- AI appears to "think" in multi-move turns (use `setTimeout`)

## Internationalisation (i18n)

See [README.md § Internationalisation (i18n)](README.md#internationalisation-i18n). Use the `t()` helper from `translate.js`.

## Maintenance philosophy

This is a volunteer side-project with limited time. Prefer simple, consistent, easy-to-maintain code. New games should be straightforward to add by following the existing pattern. Avoid over-engineering.
