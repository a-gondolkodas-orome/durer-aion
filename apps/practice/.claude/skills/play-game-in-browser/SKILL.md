---
name: play-game-in-browser
description: Launch the dev server and play a game in a real browser with Playwright, to verify a BoardClient or game-parts change. Use whenever board rendering, hover previews, mid-turn state, disabled pieces, theming or anything else visual changed — no spec in this repo covers board interaction.
---

# Play a game in a browser

## Why this exists

Nothing in the test suite clicks a board. `plays-to-an-end.spec.ts` asserts that
a match completes and names a winner, `renders.spec.tsx` that a board renders at
all — both drive the *engine*, not the UI. So every claim about what a player
sees mid-turn is unverified until someone plays the game.

That gap has already cost a bug. PR #461 claimed to have fixed `pile-splitter`
showing a bare `0` for a pile it had just emptied, where the three- and
four-pile boards show 🗑️. Only the bot's half of it was actually fixed:
`removePile` does not end the turn, so on the mover's own `useDeferredMove` beat
the label took a different branch and still rendered `0`. Lint, typecheck and
1890 tests were green the whole time. A single playthrough would have caught it,
and eventually a user did.

## Start the dev server

```bash
npm run dev     # port 8012, pinned in vite.config.js
```

Run it in the background and stop it when you are done.

## Drive it

`drive.mjs` next to this file covers everything up to "a game is running and it
is my turn" — that part is `strategy-game-factory`'s own chrome and is identical
for every game. Board clicking is per game and belongs in your script.

Write the script under `$CLAUDE_JOB_DIR/tmp` or another scratch directory, not
in the repo. Import the helper by absolute path (Playwright resolves from the
repo root, which the helper handles):

```js
import { launchGame, sampleDuringBeat, readAll }
  from '/workspaces/durer-jatekok/.claude/skills/play-game-in-browser/drive.mjs';

const { browser, page } = await launchGame('PileSplitter', { mode: 'vsHuman' });

await page.locator('button.rounded-full:not([disabled])').first().click();
const headers = await sampleDuringBeat(page, p => readAll(p, 'p.text-xl'));

console.log(headers);            // ["6","🗑️","1","5"]
await page.screenshot({ path: '/tmp/midturn.png' });
await browser.close();
```

`launchGame(gameId, { mode, variant, viewport })`:

- `gameId` is the key in `gameList.ts` (`PileSplitter`, `ChessRook`, …). The app
  is **hash-routed**: `#/game/<id>`. A bare `/game/<id>` renders the overview
  instead, silently — an easy half hour to lose.
- `mode`: `vsComputerFirst` (default), `vsComputerSecond`, `vsHuman`.
- `variant`: the radio's label text, e.g. `'Teszt'`, `'Teljes'`, `'Okos 🤖'` —
  needed to reach a specific bot. Mode and variant are `input[type=radio]
  .sr-only`, so they are driven by clicking the label; both restart the game, so
  they are set before the game starts.
- Two-player mode needs a second click (`Kezdek`, which side begins) that vs
  computer does not. Without it the board renders with every piece `disabled`,
  which reads exactly like a bug in the code you are testing. `launchGame`
  throws instead if the game did not start.

The UI is Hungarian by default; the `EN` button in the header switches it, which
is worth doing if your assertions read better in English.

`sampleDuringBeat(page, read)` polls for 1.6 s. Mid-turn states last one
`stepDelay()` beat — 750–1250 ms, `strategy-game-factory/engine/timing.ts` — so
they must be sampled, not awaited: by the time a `waitFor` on the next state
resolves, the frame you wanted is gone. This is the only way to see the board
between the two halves of a turn, which is where multi-move games go wrong.

## What to actually look at

**Look at the screenshot.** A blank frame is a failed launch, not a pass. Text
assertions confirm what you thought to assert; the image shows what you didn't.

Worth a playthrough whenever the diff touches a board:

- **Between the two halves of a turn**, for any game whose turn is more than one
  move — the mover's own beat *and* the bot's. They take different branches.
- **Both modes.** `vsHuman` is the one that gets skipped, and it is the only one
  where a human plays both sides of a turn boundary.
- **Each variant**, if the bots differ — a `Teszt` bot reaches positions the
  smart one avoids.
- **Hover previews**, which no headless test can see at all. Hover state
  survives clicks that are not moves (picking a pile to discard), so check it
  after such a click, not only before.
- **Dark mode** (☀ / ◑ / ☾ in the header) if any colour class changed. Which of
  two `bg-` utilities wins is Tailwind's emit order, not the order written.

## When you are done

Stop the dev server and delete the scratch script. If you found a bug, the fix
belongs with a note in the PR that it was found by playing the game — that is
the only evidence available, since no spec can carry it.
