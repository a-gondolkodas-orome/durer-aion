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
2. Create a react component for the game under `src/components/games`.
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
type Board = number;

const moves = {
  addNumber: {
    apply: (board: Board, { ctx }: { ctx: Ctx }, number) => {
      const nextBoard = board + number;
      if (nextBoard >= 20) {
        return { nextBoard, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  // no handler guard needed: the framework ignores dispatches that are not
  // allowed; `disabled` is for the player's benefit
  return <GameBoard>
    <button disabled={!ctx.isClientMoveAllowed} onClick={() => moves.addNumber(board, 1)}>1</button>
    <button disabled={!ctx.isClientMoveAllowed} onClick={() => moves.addNumber(board, 2)}>2</button>
  </GameBoard>
};

const botStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const optimalStep = board % 3 === 0 ? 1 : (3 - board % 3)
  moves.addNumber(board, optimalStep);
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

## Must have for a new game

<details>
<summary>The details</summary>

### board object

Concept: `board` holds the state necessary to know the game state, specific to
each game, that the next player needs to know. Common state, managed
by the framework is stored in `ctx` (such as `currentPlayer`).

See `generateStartBoard()` inside each variant.

### possible game moves

Conceptually a `move` is a unit that captures a change in the board initiated by
a player. Moves help ensure that the game is played according to rules by all
players.

Technically a move function takes board as first param, a framework-provided
meta object as second param and may receive any number of additional params
(provided by the client based on player interaction or by the bot strategy).

A move may result in ending the turn of the current player or ending the game or
allow further moves within the same turn. In the preferred, outcome-returning
form (`apply`) the move expresses all of this as data in its return value
(a `MoveOutcome`):

- `nextBoard` (required): the board after the move
- `isTurnEnd`: `true` passes the turn; omitted = further moves follow within
  the same turn. Ignored when `gameEnd` is present.
- `gameEnd: { winnerIndex }`: the game is over, with an always explicit winner
  (`ctx.currentPlayer!` when the mover wins)
- `nextTurnState`: new `ctx.turnState` value (`null` clears it; omitted =
  unchanged)
- `autoEndOfTurn`: `true` asks the framework to auto-dispatch
  `gameplay.endOfTurnMove` after a short delay

`apply` receives `{ ctx }` and no `events` — it is a pure function, which
is what lets the same move logic run on a possible future authoritative
competition server. The legacy form (`legacyApply`) instead receives
`{ ctx, events }` and calls `events.endTurn()` / `events.endGame(winnerIndex?)`
imperatively; existing games are migrated one by one, new games should use
`apply`.

You must always pass `board` as a first param to all moves (meaning you must
pass the updated board to subsequent moves in case of multiple moves within a
turn). The framework's own state lives in a synchronous store outside React
and is authoritative, so the engine no longer *needs* the argument for
correctness — it stays because a move is a pure function of its inputs, usable
outside a live game (bot look-ahead and specs call moves directly on
hypothetical boards), and because the explicit threading lets the engine catch
chaining bugs: passing a stale board to a chained move throws in development
("stale board passed to move …") instead of corrupting the game — see
[AGENTS.md § Game state architecture: synchronous store outside
React](AGENTS.md#game-state-architecture-synchronous-store-outside-react).

In `gameplay.moves`, each entry is either a legacy move function itself
(shorthand) or a long-form object `{ apply, validate? }` (preferred) /
`{ legacyApply, validate? }` (legacy):

```ts
moves: {
  removeCoin: {
    validate: (board, { ctx }, value) => board[value - 1] > 0,
    apply: (board, { ctx }, value) => { /* ... */ return { nextBoard, isTurnEnd: true }; }
  }
}
```

Neither `apply` nor `legacyApply` validates its arguments — they apply them
blindly; legality lives in `validate`, right next to them.

### validate (optional, per move)

`validate` is a pure predicate `(board, { ctx }, ...args) => boolean` colocated
with `apply` — the single source of truth for move legality. The framework
rejects dispatches that fail it, and exposes it on the wrapped move as
`moves.<name>.isAllowed(board, ...args)` (turn ownership AND `validate`, `ctx`
bound) for the `BoardClient`'s `disabled` state. Full contract in
[AGENTS.md](AGENTS.md#strategygamefactory-api).

<details>
<summary>Details</summary>

- Enforcement: the `moves` object the `BoardClient` receives silently ignores
  any dispatch that fails `isAllowed` — click handlers need no
  `if (!allowed) return` guards (keep one only when the handler couples local
  UI state to a successful move, see `cube-coloring`). Bot and auto
  end-of-turn dispatches failing `validate` throw in development, and warn +
  record an `illegal-move` analytics event + no-op in production.
- A shorthand move (plain function) has no argument validation — fully opt-in.
- Keep the "whose turn is it" check out of `validate` — `isAllowed` folds
  `ctx.isClientMoveAllowed` in for you.
- `isAllowed` is not for bots: during the bot's turn `isClientMoveAllowed` is
  false by design, so bots enumerate legal moves via the raw `validate`/helpers.
- `validate` is React-free, so a future authoritative/competition server could
  run the exact same predicate.
- Worked examples: `coins-in-3-piles` (two-phase turn), `cube-coloring` (reuses
  its `isAllowedStep` helper).

</details>

### BoardClient React component

`BoardClient`: a React component which renders the board and calls appropriate
move functions triggered by user interaction.

Props passed by framework:

- `board` (result of last move),
- `ctx`, (i.e. to know whose turn it is)
- `events` (i.e. to `setTurnState`) and
- `moves`

Additional state variables may be created within the `BoardClient` component
that is relevant only during a turn, not between turns, such as reacting to
hover events.

### Bot strategy

Given `board` and `ctx` what move(s) should the bot make?

To emulate thinking time for bot in case of multiple moves within a turn,
subsequent moves must be wrapped in setTimeout, this is not (yet) handled by the
framework.

## state provided and handled by "framework" (strategyGameFactory)

`board` is updated after every move

`ctx` is an object and will contain the following (extendable):
- `isHumanVsHumanGame`: boolean (true when two humans play; false when the user
  plays agains the computer)
- `isClientMoveAllowed`: boolean, use it to disable interactions while the other
  player's (or computer's) turn is in progress
- `currentPlayer`: 0/1 (whose turn it is — use this for game logic in both modes)
- `chosenRoleIndex`: null/0/1 (the role the human chose; only meaningful in
  `vsComputer` mode)
- `turnState`: use for multi-stage turns or other state that needs to be
  remembered during a turn, i.e. to expose it from BoardClient to
  getPlayerStepDescription

`events` is an object that will contain the following (extendable):
- `endTurn`: a function (legacy `legacyApply`/shorthand moves only — outcome-returning moves
  return `isTurnEnd: true` instead)
- `endGame`: a function with optional winnerIndex specified, if not, last player
  to move is the winner (legacy `legacyApply`/shorthand moves only — outcome-returning moves
  return `gameEnd: { winnerIndex }` with an explicit winner instead)
- `setTurnState`: a function to set `turnState` — still current for
  `BoardClient` components that keep mid-turn UI state in `ctx.turnState`
</details>

## Things to look out for

- do not allow the player interacting with the game while the other player's
  (or computer's) turn is in progress, use `ctx.isClientMoveAllowed`
- are the starting positions representative of the game complexity?
- can the player win with a not-winning strategy?
- never modify react state (e.g. the board) in place
- the game should work both in `vsComputer` and `vsHuman` mode
- is it easy to guess the winning strategy from watching the bot play?
- is the game (mostly) mobile-friendly?
- is the game usable only with keyboard (without a mouse)?
- is it clear what the player should do next?
- pretend the bot is thinking in turns with multiple moves (for one move it is
  handled by framework)

## Internationalisation (i18n)

The site supports Hungarian (default) and English. See `TicTacToe`
for a complete example. English translations are added on a game-per-game bases,
it is fine to add new games with Hungarian only.

The `t()` helper from `translate.ts` resolves a value to the active language.
The value can be a plain string if there are no translations available, or a
`{hu, en }` object. For longer strings, consider extracting the english versions
to `<game-name>-en.ts` to keep the main files more compact.

Check the [Dürer Archive](https://durerinfo.hu/archivum/feladatsorok/) for
existing translations.

Example internationalization of existing games:
[Pairs of
numbers](https://github.com/a-gondolkodas-orome/durer-jatekok/pull/213/changes/b574233c4e0c3e7d8c9dde3a2388a47133f93e10),
[4 piles: spread
ahead](https://github.com/a-gondolkodas-orome/durer-jatekok/pull/213/changes/1981715efa316e7bf1608c7b441dc0898ea6ed2f),
[Add N, take
2N](https://github.com/a-gondolkodas-orome/durer-jatekok/pull/213/changes/16158b67ece84ff68f25afbe9365f6650c7273d3)

## Technologies used

<details>

- Node.js for the development server and building the application
- React frontend framework ([official tutorial](https://react.dev/learn) is a
  good starting point)
- [optional] Tailwindcss for styling with utility classes
- [optional] vitest for unit testing
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
