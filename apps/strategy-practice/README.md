# strategy-practice

Code for the online, client-side versions of past strategy games at the Dürer
Math Competition. Merged into the monorepo from the durer-jatekok repository;
lived as `apps/practice` until the relay practice app made that name ambiguous
(pre-rename history: `git log -- apps/practice`).

The deployed version is here: https://gyakorlo.durerinfo.hu/jatekok/ .

A push to the default (main) branch deploys to the live website within a few
minutes. The checks run on the same push but do **not** gate it: `ci.yml` and
`pages-deploy.yml` are separate workflows with no dependency between them, so a
red build does not hold the deploy back. There is no staging step either — the
workflow going green *is* the cutover.

## Project setup

Two ways to get started:

- **Locally**: install the Node.js version in the repository root's `.nvmrc`
  globally (or run `nvm use`, which finds that file from this directory too), then
  run `npm ci` **at the repository root**. This app is a
  workspace of the monorepo now: there is one lockfile, at the root, and running
  `npm ci` here installs only this subtree and leaves the root's own dependencies
  unmet — exiting 0 while doing it. Every other command below runs from here.
- **Devcontainer**: a fairly minimal setup, written for local Docker. It pins
  Node and bakes Playwright's Chromium into the image, so container creation
  only has to run `npm ci`; it also ships the GitHub CLI and keeps `gh` and
  Claude Code logins in named volumes across rebuilds. Details below.

Claude Code on the web is neither: its container ships its own Node and starts
without `node_modules`, so the monorepo's `.claude/hooks/session-start.sh`
installs the pinned Node through nvm and puts it on `PATH` ahead of the image's
own, then runs `npm ci` for every lockfile in the repository — one, since this
app joined the workspaces. It reads the version from `.nvmrc` rather than
restating it, so it is not another place to keep in sync.
The hook lives at the repository root because only the root
`.claude/settings.json` is loaded for a session opened there.

<details>
<summary>Devcontainer details</summary>

- **Codespaces** supports only a restricted set of devcontainer properties and
  may ignore the `mounts` block, in which case none of the persistence below
  happens.
- **Playwright**: bumping `playwright` in `package.json` means bumping
  `PLAYWRIGHT_VERSION` in `.devcontainer/Dockerfile` and rebuilding, or
  Playwright looks for a browser revision that is not in the image.
- **Node** is pinned by the devcontainer feature in
  `.devcontainer/devcontainer.json` (the image tag only fixes the major) to the
  version in the repository root's `.nvmrc`; the root README § Requirements lists
  every file that repeats it. Bump them together, or the container quietly runs
  a different Node than CI. The root `npm test` fails on either mismatch, so
  you will not find out the hard way.
- **npm's update notifier is off** (`NPM_CONFIG_UPDATE_NOTIFIER`): the npm that
  matters is the one bundled with the pinned Node.
- **`gh`** does not pick up your SSH key or VS Code's credential helper, so run
  `gh auth login` once inside the container. A fine-grained token limited to
  this repository is enough.
- **Named volumes** keep the `gh` and Claude Code logins across rebuilds
  (`CLAUDE_CONFIG_DIR` points at the default path only so `~/.claude.json` lands
  inside the volume too). They take their `node` ownership from the image the
  first time Docker creates them, so a volume from an older version of this
  setup stays root-owned and **rebuilding does not repair it** — `gh auth login`
  keeps failing. Remove them and rebuild:
  `docker volume rm durer-gh-config durer-claude-home`. Volume names are per
  Docker host, so every clone and worktree on one machine shares the login.

</details>

## Useful npm commands

```bash
npm run dev              # compiles and hot-reloads for development
npm test                 # unit tests; the root `npm test` runs them too
npm run typecheck
npx eslint . --fix       # lint this app alone; `npm run lint:fix` at the root does the whole repo
npm run build            # prod build — some problems only appear here

npm run coverage         # line coverage, on demand
```

What the coverage report is good for, and why nothing gates on it, is in
[AGENTS.md § Coverage](AGENTS.md#coverage).

## IDE setup

Recommended VS Code extensions — the same list `.devcontainer/devcontainer.json`
installs, so a dev container needs nothing from this section:

- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Tailwind Css](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
- [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)

This app's `.gitignore` excludes `.vscode/`, so the editor settings that go with
them — eslint-on-save, and `formatOnSave` off so no formatter undoes it — are
inlined in `.devcontainer/devcontainer.json` rather than committed as a
workspace settings file. Working outside a container, copy them from there; the
repository root keeps the equivalent settings in its own `.vscode/settings.json`.

## Adding a new game

To keep track of who works on which game, use [this
table](https://docs.google.com/spreadsheets/d/1-6u9PCtvf_gDHrs65x36pmDzFt4nZZx_IUuXrgS2aZk/edit#gid=0).

1. Add the game metadata to `src/components/games/gameList.ts`.
2. Create a folder for the game under `packages/games/src/` with the standard
   files: a React-free `gameplay.ts` (the `Board` type, start boards and
   `moves`), `bot-strategy.ts`, the game itself `<game>.tsx` (plus
   `board-client.tsx` once the JSX outgrows the game file), and a
   `gameplay.spec.ts` — see [Where it lives](#where-it-lives). A game there
   exports a `StrategyGameConfig` object rather than a component;
   `remove-divisor-multiple` is the one to copy.
3. Export the config from `packages/games/index.ts`, then turn it into a page in
   the barrel at `src/components/games/index.ts` —
   `export const MyGame = strategyGameFactory(myGameConfig);` — keyed by the
   game's `gameList` key. The router in `src/components/app/app.tsx` picks it up
   automatically — no edit needed there.

   The older games still live under `src/components/games/<game>/` and export a
   component the barrel re-exports directly. Both shapes work; new games take
   the first.

Every field, edge case and enforcement rule of the engine API lives in
[src/components/CLAUDE.md](src/components/CLAUDE.md). *It is recommended to copy
and modify an existing, similar game.*

## Anatomy of a game

This project uses the React frontend "framework"; the [official
tutorial](https://react.dev/learn) is a good starting point. The common parts of
all games (showing rules, alternating turns, buttons for choosing a role,
restart game) are extracted to a `strategyGameFactory`, which a game hands four
things.

<details>

<summary>A minimal demonstrative example</summary>

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

**`gameplay.moves`** — a move is one player-initiated change to the board, and
the unit that keeps the game played by its rules. Each is `{ apply, validate? }`.
`apply` is a pure reducer that *returns* everything it causes — the next board,
and whether the turn passed, the game ended or the mid-turn state changed —
rather than causing it, and it applies its arguments blindly. Legality lives in
the optional `validate` next to it, the single source of truth: the engine
enforces it, and the `BoardClient` reads it back as
`moves.<name>.isAllowed(board, ...args)` to drive `disabled`.

**`BoardClient`** — the React component that draws the board and dispatches
moves, given `board`, `ctx`, `moves` and `setTurnState`. State that only matters
within a turn (a hover, a pending selection) belongs in the component, not in
`board`.

**`variants[]`** — each supplies `generateStartBoard()` or `startBoards`, and a
`botStrategy`: a pure function of the position that *names* the move it wants,
`({ board, ctx }) => ({ move, args })`. See [src/components/CLAUDE.md § Bot
contract](src/components/CLAUDE.md#bot-contract), and [AGENTS.md §
Testing](AGENTS.md#testing) for what being a pure function buys a spec.

**`presentation`** — the rule text and `getPlayerStepDescription`, both i18n
values.

### Where it lives

A game folder splits along one line: `gameplay.ts` holds the `Board` type, the
start boards, the `moves` and the legality and win-detection helpers they use,
and never imports React — ESLint enforces that. The rest (`bot-strategy.ts`,
`board-client.tsx`, `<game>.tsx` with the rule text and the factory call) sits
on the React side. Which file holds what, and why the split exists, is in
[AGENTS.md § Files in a game folder](AGENTS.md#files-in-a-game-folder).

### board and ctx

`board` holds only what is specific to this game. Everything common is managed
by the framework in `ctx`: `currentPlayer`, `isClientMoveAllowed` (guard every
player interaction with it), `isHumanVsHumanGame`, `chosenRoleIndex`, and
`turnState` for multi-stage turns. Never modify either in place.

A multi-stage game pins what its `turnState` holds ([§ Pinning the turn
state](src/components/CLAUDE.md#pinning-the-turn-state)), and every move takes
the current `board` as its first argument, including subsequent moves within one
turn ([§ Game state
architecture](src/components/CLAUDE.md#game-state-architecture-synchronous-store-outside-react)
for why, given that the store is authoritative either way).

## Before opening a PR

Walk the [new game
checklist](src/components/CLAUDE.md#new-game-checklist) — both game modes,
balanced starting positions, an AI the player cannot beat with a losing
strategy, keyboard and mobile usability.

## Internationalisation (i18n)

The site supports Hungarian (default) and English. See `TicTacToe`
for a complete example. English translations are added on a game-per-game bases,
it is fine to add new games with Hungarian only.

The `t()` helper resolves a value to the active language. The value can be a
plain string if there are no translations available, or a `{ hu, en }` object.
`useTranslation()` returns it; the hook lives in `packages/engine`
(`src/react/translate.ts`) and is reached through the `language` barrel, which
is a path alias — `import { useTranslation } from 'language';`, no `../../../`.

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

## Dependency updates

The monthly report covers this app along with the rest of the monorepo, and the
root [`README.md`](../../README.md) § Dependency updates is the authority on it.
This app appears in its own rows rather than the shared ones wherever it runs
ahead. Its eslint, typescript and vitest pins match the root's and its vite
matches the other frontends'.

Every dependency here is pinned exactly, as everywhere else in the monorepo
(`save-exact` in `.npmrc`). `playwright` carries an extra constraint on top of
that: the devcontainer image bakes browser binaries for one specific version, so
the pin has to agree with `.devcontainer/Dockerfile` as well as with the
lockfile. The root `npm test` fails when they disagree
(`scripts/check-versions.test.mjs`), and does the same for every file the Node
version is written down in (the root README § Requirements lists them).

## License

Copyright (c) 2020-present [A Gondolkodás Öröme
Alapítvány](https://agondolkodasorome.hu/).

The problems originate from the [Dürer Math Competition](https://durerinfo.hu/)
and remain the intellectual property of their respective authors.

This project is licensed under [Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA
4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/). You may share and
adapt this material for non-commercial purposes, provided you give appropriate
credit and distribute your contributions under the same license.
