---
name: new-game
description: Implement a new Dürer competition game from scratch, under apps/strategy-practice. Use when asked to add, implement or port a Dürer strategy game — it covers the game folder layout, the gameplay/bot split, curated start boards, tests and registration.
---

# Implement a new Dürer competition game

The game to implement is whatever the caller named — the skill arguments, or
the request that triggered this.

## Steps

### 1. Understand the game
If the game rules weren't given, ask for them before proceeding. You need to
know:
- What the board/state looks like
- What moves each player can make on their turn
- What the win condition is
- Whether there are meaningful variants (e.g. different starting configurations)

Past Dürer competition problem sets (including written solutions) are archived
at https://durerinfo.hu/archivum/feladatsorok/. If the user provides a reference
to a specific PDF (year, round, problem number), fetch it and read the problem
statement and solution. If they paste the solution text directly, use that.
Either way, use the written solution to inform both the board design and the AI
strategy — it often contains the key invariant or characterisation that makes
the optimal strategy straightforward to implement.

> **Reminder:** Once the game is identified, ask the user to mark it as **in
> progress** in the [game tracking
> spreadsheet](https://docs.google.com/spreadsheets/d/1-6u9PCtvf_gDHrs65x36pmDzFt4nZZx_IUuXrgS2aZk/edit?gid=0#gid=0)
> before implementation starts, to avoid duplicate work by other developers.

Before proceeding further, also collect the following metadata if not already
provided — they are quick to answer and needed throughout implementation:

- **year**: display string (e.g. `"XVI. (22/23)"`) and sort string (e.g.
  `"22/23"`)
- **category**: one or more of A, B, C, D, E, E+
- **round**: `online` or `döntő`
- **short name**: shown on the overview card (bilingual if needed)
- **camelCase key**: used as the folder name, route path, and `gameList` key
  (e.g. `PlusTwoThree`)
- **credit**: `suggestedBy` and/or `developedBy` — optional, but ask explicitly
  so it isn't forgotten

#### Porting a game from the live competition
An online round's game already exists, rules and bot included, in
`packages/game/src/games/strategy/<game>/` — or in that year's private repo
until the competition is over, which is when it may come here and not before
(root `AGENTS.md`, secrecy). Most of the above is then answered already:

- **rule**: the description in its `main.tsx`, minus what only the competition
  needs — "beat the computer twice in a row", choosing a role. That is the
  allowed rewording below; show the user the before/after.
- **metadata**: round `online`, the year in the `"XIX. (25/26)"` form, `credit`
  `developedBy` the competition's developer, as `RemoveDivisorMultiple` and
  `StonesRemoveOneNotTwiceFromLeft` have.
- **categories that play different rules** — a different first mover, board or
  count — become separate `gameList` entries sharing one folder
  (`architect-and-bandits` A and B), each with its own card and URL. A variant's
  `rule` override is for siblings whose differing rules still read as one game.
- **bot**: reuse the competition's strategy rather than re-deriving it; it is the
  one the round was decided by. Its moves are a boardgame.io call shape, so
  adapt it to name this engine's moves, and its test-mode randomness becomes the
  Teszt variant (step 9). Step 2 still applies to whatever table it reads.

### 2. Plan the AI strategy
A game is useful even without an optimal AI: human vs human mode lets real
players test and play immediately, and a placeholder random/simple bot is enough
to get started. Ask the user whether they want the optimal strategy implemented
now or later.

- **If now:** spend up to ~3 minutes reasoning through the winning strategy. If
  you arrive at a clear characterisation, explain it to the user before writing
  code. If after ~3 minutes you haven't found a clean solution, say so
  explicitly — don't keep the user waiting longer — and ask if they have any
  hints (e.g. from the official solution, a known invariant, or their own
  intuition). If hints resolve it, proceed; otherwise fall back to "later" and
  leave a placeholder.
- **If later:** implement a simple or random bot strategy as a placeholder and
  note clearly in a code comment that it is not optimal yet.

Whether it needs a **precomputed table** is a measurement, not a guess: time the
strategy computed live from the hardest start board first. A ported competition
bot may ship one only because a server answered every team — `two-xs-one-o`'s O
solver works out the empty board in ~25 ms and memoises, so it ships none. If
searching at play time is too slow, commit the table's generator in the same PR
— never the table alone. What the script has to guarantee is in [AGENTS.md §
Architecture](../../../AGENTS.md#architecture); `modified-mill-strategy.cjs` is
the worked example, and it should also verify the table (e.g. replaying it
against every opponent reply) rather than write one it cannot prove correct.

Note: written solutions typically only describe what to do from a winning
position. The AI also needs a strategy for losing positions — i.e. when the
opponent holds the winning advantage but hasn't played optimally. In that case
the bot should still play as well as possible: making moves that are hardest to
respond to correctly, maximising the chance the human makes a mistake. Ask the
user how they want this handled if it isn't obvious from the solution.

### 3. Pick a reference game to copy
Choose the simplest existing game that resembles the new one structurally:
- Number/token games with simple state:
  `src/components/games/single-number-increase/plus-one-two-three/plus-one-two-three.tsx`
- Games with variants (multiple starting configs): look in
  `src/components/games/pile-splitting-games/`
- Grid/board games: `src/components/games/chess-rook/` or
  `src/components/games/shark-chase/`

Read the chosen reference file in full before writing anything.

### 4. Create the game files
Create `src/components/games/<game-name>/gameplay.ts` (board type, start boards,
moves), `<game-name>.tsx` (rule and step description components, variants,
factory call) and its text in `src/locales/{hu,en}/<game-name>.json`; the
README's i18n section says how a game reads it. Two shapes are in use: most games export the component
`strategyGameFactory(...)` returns, and `remove-divisor-multiple` and
`stones-remove-one-not-twice-from-left` export a `StrategyGameConfig` object
instead, leaving the factory call to the barrel. Which shape everything should
settle on is open —
[#517](https://github.com/a-gondolkodas-orome/durer-aion/issues/517) — so copy
whichever your Step 3 reference game uses rather than mixing the two. Which file
holds what — and why `gameplay.ts` must stay React-free — is in [AGENTS.md §
Files in a game folder](../../../AGENTS.md#files-in-a-game-folder); the contract
you are implementing — `moves`/`apply`/`validate`, `isAllowed`, the bot
contract, `ctx`, `setTurnState`, `useDeferredMove` — is in
[src/components/AGENTS.md § strategyGameFactory
API](../../../src/components/AGENTS.md#strategygamefactory-api). Read both
rather than guessing from the reference game alone. Authoring decisions on top
of them:
- If the user supplied the rule text, use it verbatim as the Hungarian `rule` by default.
  Don't silently rephrase, correct, or abbreviate it. **Exception:** when the
  original wording doesn't fit the online implementation — e.g. it refers to the
  competition organizers/judges instead of the opponent/computer, or to physical
  artifacts (paper, pencil, cards on a table) that don't exist in the browser
  version — it's fine to reword it slightly to fit. In that case, explicitly
  highlight every change you made to the user (e.g. show before/after) so they
  can review it. For any other wording change, propose it and wait for approval
  before applying.
- For user-facing text referring to the other participant, prefer "other player"
  / "másik játékos" over "opponent" / "ellenfél" — the latter reads as too
  harsh, especially in Hungarian
- `getPlayerStepDescription` should make it obvious what the current player
  should do — it is the game's instruction line, not a status label
- Pull `credit` from `gameList`, and the name and title from the `catalog`
  namespace, rather than hardcoding them
- A turn of several placements — two Xs, a stone then a line — is one move per
  placement with `turnState` counting between them, not one move taking them
  all. The engine's undo then covers the half-made turn, which the checklist
  asks for, with no selection UI to build (`two-xs-one-o`, `coins-in-3-piles`)

### 5. Export the game, then wire it into `src/components/games/index.ts`
Add one line to the app's barrel keyed by the game's `gameList` key, keeping
alphabetical order — by character code, so `TwoTimesTwo` comes before
`TwoXsOneO`. A game exporting a component is re-exported directly —
`export { YourGame } from './path/...'`, aliasing if the export name differs;
one
exporting a config becomes a page here instead —
`export const YourGame = strategyGameFactory(yourGameConfig);`.
The route is the key, and the router in `src/components/app/app.tsx` derives it
from `gameList` automatically — no edit is needed there.

### 6. Add metadata to `src/components/games/gameList.ts`
Using the metadata collected in Step 1, add the entry where the file's own
comment says — ordered by year, then category, which for a new competition's
game means at the end — and its name under the same key, at the same place, in
`src/locales/{hu,en}/catalog.json`. Add a
`title` there only if a longer display name is needed on the game page beyond
the short name.

### 7. Run tests and verify
If the optimal AI was implemented, write a test that plays it rather than one
that eyeballs a single decision. `runMatch` (from `strategy-engine`, re-exported
by
`strategy-game-factory`) plays
a whole game headless through the real moves, validators and win detection:

```typescript
const { winnerIndex } = runMatch({
  gameplay: { moves },
  strategies: [smartBotStrategy, randomBotStrategy],
  startBoard
});
```

Assert what the checklist asks for: the smart bot wins as the mover from a
board the mover can win, and as the replier from one it cannot. [AGENTS.md §
Testing](../../../AGENTS.md#testing) covers the rest — reading a single decision
with `botNextMoveArgs`, and how many boards to sweep given what the strategy
costs.

A match against the random bot shows the smart bot wins *some* games; it cannot
show it never loses one it should win. Two habits close that gap:

- **Where the losing side's replies can be enumerated, enumerate them.** Walk the
  smart bot against every line the other player can play — a few thousand
  positions is milliseconds — and assert it wins all of them (`two-xs-one-o`'s
  `bot-strategy.test.ts`).
- **Break each part of the strategy and watch a test fail.** Disable one branch
  or one fallback at a time; if the suite stays green, that part is untested,
  however many tests pass. A heuristic and the solver it backs up often agree on
  random positions, so search for one where they disagree and pin it.

Drawn boards in a test (`'XXO../O.X..'`) read to cspell as misspelt words;
`// cspell:ignoreRegExp` at the top of the file, matching just those strings,
keeps the rest of the file checked.

```bash
npm run typecheck && npm test
```
Then start the dev server and play the game with the `play-game-in-browser`
skill, which drives it in a real browser and says what to look at.

### 8. Go through the checklist
Before declaring the game done, walk [src/components/AGENTS.md § New game
checklist](../../../src/components/AGENTS.md#new-game-checklist) and verify each
item against the running game, not against your intent to have satisfied it.
Two of them are worth naming here because they are the ones that quietly go
unchecked:

- the optimality claim must be backed by the `runMatch` test from step 7, not by
  eyeballing a few of the bot's moves
- the game must be played through in **both** `vsComputer` and `vsHuman` mode

### 9. Offer a test bot variant (only if optimal AI was implemented)
If the optimal AI strategy was implemented in step 2, ask the user:

> "Do you want a 'test bot' variant that plays randomly but wins if it can in 1
> move?"

**If yes**, update the game file:

1. Add a `randomBotStrategy` function — pick a random valid move, but if any
   move wins immediately (wins in 1 turn), pick one of those winning moves
   instead. Follow the pattern in
   `src/components/games/ten-digit-number/ten-digit-number.tsx`.

2. Rename the existing optimal bot strategy to `smartBotStrategy` (or a
   similarly descriptive name).

3. Restructure `variants` to put the test bot first and the smart bot second
   (marked `isDefault: true`):
   ```typescript
   variants: [
     {
       botStrategy: randomBotStrategy,
       label: testVariantLabel
     },
     {
       botStrategy: smartBotStrategy,
       generateStartBoard: ...,
       label: fullVariantLabel,
       isDefault: true
     }
   ]
   ```
   By default `generateStartBoard` stays on the `isDefault` variant only. If the
   test variant benefits from a simpler starting position, add its own
   `generateStartBoard` override.

4. Re-run `npm run typecheck && npm test` and verify both variants work in the
   dev server before declaring done.

**If no**, skip and declare the game done.
