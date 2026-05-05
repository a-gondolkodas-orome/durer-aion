---
description: Implement a new Dürer competition game from scratch
---

Implement a new Dürer competition game. The game to implement: $ARGUMENTS

## Steps

### 1. Understand the game
If the game rules weren't provided in $ARGUMENTS, ask for them before proceeding. You need to know:
- What the board/state looks like
- What moves each player can make on their turn
- What the win condition is
- Whether there are meaningful variants (e.g. different starting configurations)

Past Dürer competition problem sets (including written solutions) are archived at https://durerinfo.hu/archivum/feladatsorok/. If the user provides a reference to a specific PDF (year, round, problem number), fetch it and read the problem statement and solution. If they paste the solution text directly, use that. Either way, use the written solution to inform both the board design and the AI strategy — it often contains the key invariant or characterisation that makes the optimal strategy straightforward to implement.

Before proceeding further, also collect the following metadata if not already provided in $ARGUMENTS — they are quick to answer and needed throughout implementation:

> **Reminder:** Once the game is identified, ask the user to mark it as **in progress** in the [game tracking spreadsheet](https://docs.google.com/spreadsheets/d/1-6u9PCtvf_gDHrs65x36pmDzFt4nZZx_IUuXrgS2aZk/edit?gid=0#gid=0) before implementation starts, to avoid duplicate work by other developers.
- **year**: display string (e.g. `"XVI. (22/23)"`) and sort string (e.g. `"22/23"`)
- **category**: one or more of A, B, C, D, E, E+
- **round**: `online` or `döntő`
- **short name**: shown on the overview card (bilingual if needed)
- **camelCase key**: used as the folder name, route path, and `gameList` key (e.g. `PlusTwoThree`)
- **credit**: `suggestedBy` and/or `developedBy` — optional, but ask explicitly so it isn't forgotten

### 2. Plan the AI strategy
A game is useful even without an optimal AI: human vs human mode lets real players test and play immediately, and a placeholder random/simple bot is enough to get started. Ask the user whether they want the optimal strategy implemented now or later.

- **If now:** spend up to ~3 minutes reasoning through the winning strategy. If you arrive at a clear characterisation, explain it to the user before writing code. If after ~3 minutes you haven't found a clean solution, say so explicitly — don't keep the user waiting longer — and ask if they have any hints (e.g. from the official solution, a known invariant, or their own intuition). If hints resolve it, proceed; otherwise fall back to "later" and leave a placeholder.
- **If later:** implement a simple or random bot strategy as a placeholder and note clearly in a code comment that it is not optimal yet.

Note: written solutions typically only describe what to do from a winning position. The AI also needs a strategy for losing positions — i.e. when the opponent holds the winning advantage but hasn't played optimally. In that case the bot should still play as well as possible: making moves that are hardest to respond to correctly, maximising the chance the human makes a mistake. Ask the user how they want this handled if it isn't obvious from the solution.

### 3. Pick a reference game to copy
Choose the simplest existing game that resembles the new one structurally:
- Number/token games with simple state: `src/components/games/plus-one-two-three/plus-one-two-three.js`
- Games with variants (multiple starting configs): look in `src/components/games/pile-splitting-games/`
- Grid/board games: `src/components/games/chess-rook/` or `src/components/games/shark-chase/`

Read the chosen reference file in full before writing anything.

### 4. Create the game file
Create `src/components/games/<game-name>/<game-name>.js`. Follow the `strategyGameFactory` API from `AGENTS.md`. Key rules:
- If the user supplied the rule text, use it verbatim in `rule.hu`. Never silently rephrase, correct, or abbreviate it — propose any wording change explicitly and wait for approval before applying it.
- `board` holds only game-specific state; common state is in `ctx`
- Every move returns `{ nextBoard }`; pass the current board when chaining moves within a turn
- Guard all player interactions with `ctx.isClientMoveAllowed`
- `getPlayerStepDescription` should make it obvious what the current player should do
- If the bot needs multiple moves in one turn, wrap subsequent moves in `setTimeout` to simulate thinking
- Pull `name`, `title`, `credit` from `gameList` rather than hardcoding them

### 5. Register the route in `src/components/app/app.js`
Add the import and a route entry. Keep both lists in alphabetical order.

### 6. Add metadata to `src/components/games/gameList.js`
Using the metadata collected in Step 1, add the entry in alphabetical order by key. Use `title` only if a longer display name is needed on the game page beyond the short name.

### 7. Run tests and verify
```bash
npm run test
```
Then start the dev server and manually verify the game:
```bash
npm run dev
```

### 8. Go through the checklist
Before declaring the game done, verify each item:
- [ ] Works correctly in both `vsComputer` and `vsHuman` mode
- [ ] Starting positions are representative of the game's complexity
- [ ] If optimal AI is implemented: player cannot win with a non-winning strategy
- [ ] `getPlayerStepDescription` makes the next move clear
- [ ] Interactions disabled during the other player's turn (`ctx.isClientMoveAllowed`)
- [ ] Mobile-friendly and keyboard-navigable
- [ ] Player can undo within multi-move turns if applicable
- [ ] AI appears to "think" in multi-move turns (uses `setTimeout`)

### 9. Offer a test bot variant (only if optimal AI was implemented)
If the optimal AI strategy was implemented in step 2, ask the user:

> "Do you want a 'test bot' variant that plays randomly but wins if it can in 1 move?"

**If yes**, update the game file:

1. Add a `randomBotStrategy` function — pick a random valid move, but if any move wins immediately (wins in 1 turn), pick one of those winning moves instead. Follow the pattern in `src/components/games/ten-digit-number/ten-digit-number.js`.

2. Rename the existing optimal bot strategy to `aiBotStrategy` (or a similarly descriptive name).

3. Restructure `variants` to put the test bot first and the smart bot second (marked `isDefault: true`):
   ```javascript
   variants: [
     {
       botStrategy: randomBotStrategy,
       label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
     },
     {
       botStrategy: aiBotStrategy,
       generateStartBoard: ...,
       label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
       isDefault: true
     }
   ]
   ```
   By default `generateStartBoard` stays on the `isDefault` variant only. If the test variant benefits from a simpler starting position, add its own `generateStartBoard` override.

4. Re-run `npm run test` and verify both variants work in the dev server before declaring done.

**If no**, skip and declare the game done.
