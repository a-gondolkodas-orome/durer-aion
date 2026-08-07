# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer
Math Competition.

The deployed version is here:
https://jatek.durerinfo.hu/ .

# Development

When you push to the default (main) branch, the tests are run, and if they are
successful, the project is deployed to the live website within a few minutes.

## Adding a new game

To keep track of who works on which game, use [this
table](https://docs.google.com/spreadsheets/d/1-6u9PCtvf_gDHrs65x36pmDzFt4nZZx_IUuXrgS2aZk/edit#gid=0).

TL;DR;

1. Add the game metadata to `src/components/games/gameList.ts`.
2. Create a folder for the game under `src/components/games` with the standard
   files: a React-free `gameplay.ts` (the `Board` type, start boards and
   `moves`), `bot-strategy.ts`, the game component `<game>.tsx` (plus
   `board-client.tsx` once the JSX outgrows the game file), and a
   `gameplay.spec.ts` — see [Where it lives](#where-it-lives).
3. Re-export the game component from the barrel in
   `src/components/games/index.ts`, keyed by the game's `gameList` key. The router
   in `src/components/app/app.tsx` picks it up automatically — no edit needed there.

*For more information, see Section [How to Develop](#how-to-develop)*

## Project setup

Two ways to get started:

- **Locally**: install the Node.js version in `.nvmrc` globally (or run `nvm use`
  in the project directory), then run `npm ci`.
- **Devcontainer**: there is a (fairly minimal) setup, written for local Docker.
  It bakes Playwright's Chromium into the image and pins Node, so container
  creation only has to run `npm ci`. It also ships the GitHub CLI and keeps `gh`
  and Claude Code logins in named volumes across rebuilds.

<details>
<summary>Devcontainer details</summary>

It is written for local Docker — GitHub Codespaces supports only a restricted
set of devcontainer properties and may ignore the `mounts` block, in which case
none of the persistence described below happens.

It bakes a Chromium build for Playwright into the image at build time, so
container creation only has to run `npm ci`. If you bump `playwright` in
`package.json`, also bump `PLAYWRIGHT_VERSION` in `.devcontainer/Dockerfile` and
rebuild the container — otherwise Playwright will look for a browser revision
that is not in the image.

Node is pinned the same way. The image tag only fixes the major version, so the
exact one comes from the node devcontainer feature in `.devcontainer/devcontainer.json`
and must match the three other places it is written down: `.nvmrc`, `engines.node`
in `package.json`, and the container image in both `.github/workflows/*.yml`. Bump
them together and rebuild, or the container quietly runs a different Node than CI does.

`npm run test` fails on either mismatch, so you will not find out the hard way.

The container also has npm's update notifier switched off
(`NPM_CONFIG_UPDATE_NOTIFIER`). The npm that matters here is the one bundled with
the pinned Node; upgrading it separately would only diverge from CI.

The GitHub CLI (`gh`) is included too. It does not pick up your SSH key or VS Code's
git credential helper, so run `gh auth login` once inside the container; the login is
kept in a named Docker volume and survives rebuilds. A fine-grained token limited to
this repository is enough for the usual PR and CI commands.

Claude Code's config directory (`~/.claude`) is a named volume as well, so its login and
settings — default permission mode, theme, notifications — survive rebuilds. `CLAUDE_CONFIG_DIR`
is set to that same default path only so that `~/.claude.json`, which normally sits next to the
directory, is stored inside the volume too.

Both volumes get their `node` ownership from the image the first time Docker creates them.
That means a volume created under an older version of this setup stays root-owned, and
**rebuilding does not repair it** — `gh auth login` keeps failing. If you hit that, remove the
volumes and rebuild:

```bash
docker volume rm durer-gh-config durer-claude-home
```

Volume names are per Docker host, so every clone, worktree and branch checkout on one
machine shares the same login state.

</details>

## Useful npm commands
<details>
<summary>The commands</summary>

### Compiles and hot-reloads for development

```bash
npm run dev
```

### Run tests

```bash
npm run test # lint and tests (as Github Actions)
```

Simple formatting errors such as trailing spaces can be automatically fixed with
```bash
npm run lint:fix
```

`npx stryker run` mutation-tests the engine on demand — not part of `npm run test` or CI, never fails a build, scope it with `--mutate "path/to/file.ts:120-160"`.

### Build for prod

(some problems only appear in prod build, not while testing, for example using a
variable without declaring it)

```bash
npm run build
```

</details>


## IDE setup

Recommended VS Code extensions:

- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Tailwind Css](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

# How to develop

This project uses the React frontend "framework", the [official
tutorial](https://react.dev/learn) is a good starting point.

The common parts of all games (showing rules, alternating turns, buttons for
choosing a role, restart game) are extracted to a `strategyGameFactory`.


*It is recommended to copy and modify an existing, similar game.*

## Minimal demonstrative example

<details>

<summary>The code</summary>

```tsx
// gameplay.ts — the React-free rules half of the game
export type Board = number;

export const moves = {
  addNumber: {
    // annotate every move argument: an unannotated one types as `any` and
    // silently disables the bot's argument type-checking
    apply: (board: Board, { ctx }: { ctx: Ctx }, amount: number) => {
      const nextBoard = board + amount;
      if (nextBoard >= 20) {
        return { nextBoard, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

// bot-strategy.ts — `Moves` pins the move names and argument types
const botStrategy: BotStrategy<Board, Moves> = ({ board }) => {
  const optimalStep = board % 3 === 0 ? 1 : (3 - board % 3)
  return { move: 'addNumber', args: [optimalStep] };
};

// <game>.tsx — the React side: BoardClient and the factory call
const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  // no handler guard needed: the framework ignores dispatches that are not
  // allowed; `disabled` is for the player's benefit
  return <GameBoard>
    <button disabled={!ctx.isClientMoveAllowed} onClick={() => moves.addNumber(board, 1)}>1</button>
    <button disabled={!ctx.isClientMoveAllowed} onClick={() => moves.addNumber(board, 2)}>2</button>
  </GameBoard>
};

export const PlusOneTwo = strategyGameFactory({
  presentation: {
    rule: <>0-ról +1/+2 20-ig</>,
    getPlayerStepDescription: () => 'Válaszd ki, hogy hánnyal növelsz.'
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy, generateStartBoard: () => 0 }]
});
```
</details>

## Anatomy of a game

A game hands `strategyGameFactory` four things. What follows is the shape of
each; every field, edge case and enforcement rule lives in
[AGENTS.md § strategyGameFactory API](AGENTS.md#strategygamefactory-api).

**`gameplay.moves`** — a move is one player-initiated change to the board, and
the unit that keeps the game played by its rules. Each is `{ apply, validate? }`:

```ts
moves: {
  removeCoin: {
    validate: (board, { ctx }, value) => board[value - 1] > 0,
    apply: (board, { ctx }, value) => ({ nextBoard, isTurnEnd: true })
  }
}
```

`apply` is a pure reducer that *returns* everything it causes — the next board,
and whether the turn passed (`isTurnEnd`), the game ended
(`gameEnd: { winnerIndex }`) or the mid-turn state changed (`nextTurnState`) —
rather than causing it. It applies its arguments blindly; legality lives in the
optional `validate` next to it, which is the single source of truth: the engine
enforces it, and the `BoardClient` reads it back as
`moves.<name>.isAllowed(board, ...args)` to drive `disabled`.

**`BoardClient`** — the React component that draws the board and dispatches
moves, given `board`, `ctx`, `moves` and `setTurnState`. State that only matters
within a turn (a hover, a pending selection) belongs in the component, not in
`board`.

**`variants[].botStrategy`** — a pure function of the position that *names* the
move it wants, `({ board, ctx }) => ({ move, args })`, or an array of those when
a turn is one decision made of several moves. The engine plays them out and
paces them, so a bot never calls a move, never threads a board and never uses
`setTimeout`. Being a pure function, its decision can be read straight off the
return value in a spec, and `runMatch` can play two strategies against each
other through the real engine — see [AGENTS.md § Testing](AGENTS.md#testing).

**`presentation`** — the rule text and `getPlayerStepDescription`, both i18n
values.

Each variant also supplies `generateStartBoard()`.

### Where it lives

A game folder splits along one line: `gameplay.ts` holds the `Board` type, the
start boards, the `moves` and the legality and win-detection helpers they use,
and never imports React — ESLint enforces that. The rest (`bot-strategy.ts`,
`board-client.tsx`, `<game>.tsx` with the rule text and the factory call) sits
on the React side. The split exists because a future server-authoritative
competition mode has to validate moves in plain Node with the very same module
(a future server-authoritative competition mode, see issue #313); it also
lets specs and the bot's move pinning import the rules without dragging in JSX.
Details in [AGENTS.md § Files in a game folder](AGENTS.md#architecture).

### board and ctx

`board` holds only what is specific to this game. Everything common is managed
by the framework in `ctx`: `currentPlayer`, `isClientMoveAllowed` (guard every
player interaction with it), `isHumanVsHumanGame`, `chosenRoleIndex`, and
`turnState` for multi-stage turns. Never modify either in place.

A multi-stage game pins what its `turnState` holds — `export type TurnState` in
`gameplay.ts`, `BoardClientProps<Board, TurnState>` on the component — and the
factory infers the rest of the config from there, so nothing has to cast it
back. See [AGENTS.md § Pinning the turn
state](AGENTS.md#strategygamefactory-api).

Always pass the current `board` as a move's first argument, including to
subsequent moves within the same turn. The framework's own state is
authoritative — it lives in a synchronous store outside React — so the argument
is not what makes the engine correct. It stays because a move is then a pure
function of its inputs, callable on hypothetical boards by bot look-ahead and
by specs, and because the explicit threading lets the engine catch chaining
bugs: a stale board throws in development instead of corrupting the game. See
[AGENTS.md § Game state architecture](AGENTS.md#game-state-architecture-synchronous-store-outside-react).

## Before opening a PR

Walk the [new game checklist](AGENTS.md#new-game-checklist) — both game modes,
balanced starting positions, an AI the player cannot beat with a losing
strategy, keyboard and mobile usability.

## Internationalisation (i18n)

The site supports Hungarian (default) and English. See `TicTacToe`
for a complete example. English translations are added on a game-per-game bases,
it is fine to add new games with Hungarian only.

The `t()` helper from `translate.ts` resolves a value to the active language.
The value can be a plain string if there are no translations available, or a
`{ hu, en }` object.

Check the [Dürer Archive](https://durerinfo.hu/archivum/feladatsorok/) for
existing translations.

For an example of internationalizing an existing game, see
[PR #213](https://github.com/a-gondolkodas-orome/durer-jatekok/pull/213).

## Technologies used

<details>

- Node.js for the development server and building the application
- React frontend framework ([official tutorial](https://react.dev/learn) is a
  good starting point)
- Tailwindcss for styling with utility classes
- vitest for unit testing (runs in CI; every game is swept by a conformance test)
- github actions for CI/CD.
- github pages as hosting
- [self-hosted umami](https://umami.durerinfo.hu) as usage tracker

</details>

# License

Copyright (c) 2020-present [A Gondolkodás Öröme
Alapítvány](https://agondolkodasorome.hu/).

The promblems originate from the [Dürer Math Competition](https://durerinfo.hu/)
and remain the intellectual property of their respective authors.

This project is licensed under [Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA
4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/). You may share and
adapt this material for non-commercial purposes, provided you give appropriate
credit and distribute your contributions under the same license.
