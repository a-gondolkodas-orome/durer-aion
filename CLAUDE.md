# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive
games, built on boardgame.io.

[`README.md`](README.md) is the authority on running things locally;
[`CONTRIBUTING.md`](CONTRIBUTING.md) is the human front door. This file carries what an agent needs that those two do not own.

## Project Structure

This is a **Turborepo monorepo** with npm workspaces:

```
apps/
  online-frontend/    # React frontend for multiplayer (Vite)
  online-backend/     # Node.js server with boardgame.io + Koa
  offline-frontend/   # the offline dry run, served at /proba-verseny/ (Vite)
  relay-practise-frontend/  # the public relay practice site, served at /valto/
  strategy-practice/  # the public strategy game practice site (from the durer-jatekok repo), served at /jatekok/
packages/
  game/               # Game logic (boardgame.io games); strategy games carry their bot and board in their own folder
  relay-bot/          # the relay game's opponent: the problem bank, and what each try is worth
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
  strategy-engine/    # the strategy practice site's game engine: rules, moves, bots, match state, no framework
pages/                # static content the Pages deploy serves but no app builds
```

**"Practice" alone is ambiguous — say which one.** The *strategy practice* site
(`apps/strategy-practice`, `/jatekok/`), the *relay practice* site
(`apps/relay-practise-frontend`, `/valto/`) and the offline *dry run*
(`apps/offline-frontend`, `/proba-verseny/`) are three different apps. The first
two are the practice sites; the dry run is a rehearsal of the competition round.

**`apps/strategy-practice` is a workspace, but not like the others.** One root
`npm ci` installs it and turbo builds, typechecks and lints it with everything
else — but it keeps its own `eslint.config.js` (`@eslint-react`, react-hooks, a
stylistic dialect: no trailing comma, `max-len` 120) and its own vitest config,
which the root `vitest.config.mts` runs as a second project. Neither is a second
command or a second toolchain: eslint, typescript, vitest and vite are the root's
pins, hoisted. It arrived as a subtree merge with that dialect already set, so
the two configs stay and ESLint applies each where it belongs — `turbo.json` says
why lint runs one process per workspace. Its own
[`AGENTS.md`](apps/strategy-practice/AGENTS.md) loads automatically under that
directory and is the authority on everything inside it; memory files nest by
directory, settings do not.

**Do not run `npm ci` from a workspace directory.** There is one lockfile, at the
root. From a workspace npm installs that subtree, leaves the root's own
dependencies unmet — which the other apps then fail to build against — and exits
0 while doing it.

A plan to replace boardgame.io with the strategy practice engine was drafted and
then deprioritized: upstream is actively maintained again (issue #277), so don't
build toward that replacement. Its remaining `npm audit` advisories are its own
transitive tree — `@koa/cors@3`, `cookie` through `react-cookies`, `svelte` — and
cannot be fixed from here. **Never run `npm audit fix --force`:** its fix for them
is `boardgame.io@0.22.1`, a four-year downgrade that would take the competition
with it. What is behind otherwise is `npm run report:outdated`'s job, monthly.

`ws` and `engine.io` were on that list until #461. boardgame.io builds its socket
layer from `koa-socket-2`, which asks for `socket.io ^3`, so npm nested a 3.x copy
under it — and *that* copy, not the 4.x one `apps/online-backend` declares, served
every match, invisibly: both speak Engine.IO 4. The `overrides` block in the root
`package.json` makes the tree one install, and two tests keep it that way:
`scripts/socketio-single-copy.test.mjs` fails the moment the lockfile grows a
second copy, and `apps/online-backend/src/socketio_transport.test.ts` plays a
match over a real socket.

## Tech Stack

- **Frontend**: React 19, Vite, MUI (Material-UI), React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsdown. The packages build into `dist` and
  ship ESM only; `packages/strategy-engine` is the exception and builds both
  formats. The backend is one tsdown bundle built from the packages' *source*, so
  neither its build, its dev server nor its typecheck waits on a package build.
  Each build config is `tsdown.config.mts`, not `.ts`, and each says how and why.
- **Testing**: vitest, React Testing Library — no Jest. Every suite is
  `*.test.ts(x)`, and which of the two vitest projects runs one is decided by its
  **path**: the root project excludes `apps/strategy-practice` and
  `packages/strategy-engine`, and that app's config includes exactly those two.
- **`apps/strategy-practice`** adds Tailwind and its own build/test setup; read
  its `package.json` rather than assuming this one's.

## Development Commands

[`README.md`](README.md) § *Getting Started* is the authority on running things;
this is the index.

```bash
npm ci && npm run setup    # install, then seed the gitignored .env files
npm run deps               # both of those; the dev:* and stack:* scripts do it for you

npm run stack:up      # nginx + backend + postgres on http://localhost, detached
npm run stack:build   # just the two deployed images, starting nothing — the CI gate
npm run teams:import  # loads scripts/test.tsv, once postgres accepts connections
npm run stack:ps      # which services are up, when a URL shows nothing
npm run stack:logs    # follow all three containers; Ctrl-C stops watching, not the stack
npm run stack:down

# The same without docker (except the DB), everything reloading, one per terminal
npm run db:up
npm run dev:server         # backend on :8000
npm run dev:online         # frontend on :5173
npm run teams:import:local

npm run dev:offline            # the /proba-verseny/ dry run
npm run dev:relay-practice     # the /valto/ relay practice site
npm run dev:strategy-practice  # the /jatekok/ strategy practice site

npm run check       # the CI gates that need no docker, cheapest first:
npm run i18n:check  #   translation keys
npm run spell-check
npm run build
npm test            # both vitest projects
npm run typecheck   # tsc --noEmit per workspace, via turbo
npm run lint        # also the formatter; lint:fix applies it, the editor runs it on save
```

All of those cover `apps/strategy-practice` too; to work on it alone,
`npm test --workspace=strategy-practice`, or `npm run check` / `npm run coverage`
from inside it. Every long docker invocation lives in a root npm script rather
than in prose, so it is written down once.

## Creating a New Game

For a game on the *strategy practice* site the `new-game` skill under
`apps/strategy-practice` is the route. The steps below are for the *live
competition* (boardgame.io).

1. One self-contained folder in `packages/game/src/games/strategy/<game-name>/` —
   `stones/` and `19ocd/` are the live examples:
   - `game.ts` - boardgame.io game definition
   - `strategy.ts` - the server bot, plus any lookup tables it imports
   - `board.tsx` - React component for the game board
   - `main.tsx` - the game description shown to players

   No `index.ts` barrel: the three files are registered separately, and a barrel
   re-exporting the bot next to the board would undo that. More files are fine —
   `stones/` keeps its `moveMap.ts` beside the bot — but what the bot and the
   board *both* need goes in `game.ts`, or the walk below reads the shared helper
   as the bot reaching the served bundle, and fails.

2. Register it in the three registries under
   `packages/game/src/games/strategy/`, one per package entry:
   `strategy-games.ts` (the `game` entry), `strategy-bots.ts` (`game/bot`) and
   `strategy-client.ts` (`game/client`). `apps/online-backend/src/server.ts`
   imports `game` and `game/bot`; the live client `game` and `game/client`; the
   offline dry run all three.

**The rules and the bot are typechecked twice.** The server reads this package's
source rather than its `dist`, under its own `lib` and without the DOM, so a
`document` in `game.ts` or `strategy.ts` passes `packages/game`'s own typecheck
and fails the server's. A board may use whatever the browser gives it: the server
never imports `game/client`.

**The live client must not ship the bot.** ESLint forbids the `game/bot`
specifier everywhere but the server and the offline dry run
(`eslint.config.mjs`), `packages/common-frontend` included, since the served
bundle carries that package too. `packages/game/src/entries.test.ts` walks the
package's graph to pin that everything the bot entry shares with the live
client's two entries is a rules file — `src/common/` or a game's `game.ts` — so a
lookup table under whatever name fails the tests instead of handing every
competitor the tables. Before a competition, still check by hand: `npm run build`,
then grep `apps/online-frontend/dist` for a lookup-table key.

### Game Structure (boardgame.io)

```typescript
{
  setup: () => G,                    // Initial game state
  moves: {
    moveName: ({ G, ctx }) => void,  // Player actions
  },
  // Wrapper additions (see packages/game/src/common/types.ts):
  possibleMoves: (G, ctx, playerID) => PossibleMove[],
  startingPosition: ({ G, ctx, playerID, random }) => G,  // optional
  turn: {
    minMoves: 1,
    maxMoves: 1,
    endIf: ({ G, ctx }) => boolean,
  },
}
```

A move takes as many arguments as you give it — `moves.changeCoins(K, L)` for a
"pick two values, then commit" turn. Both live games are single-click and
single-argument; nothing in the wrapper requires that. The opening position has
two homes, and `GameMixin.startingPosition` in
`packages/game/src/common/types.ts` says which to pick.

## Environment Files

`npm run setup` copies each of the six from its committed `*.sample` twin, never
overwriting one that exists, and names any setting a file lacks that its sample
has — key names only, never values. [`README.md`](README.md) § *Configuration you
may want to change* is the table of what reads which.

## Deployment

`npm run stack:prod` runs the production stack (no dev overlay). That is how
`verseny.durerinfo.hu`, the real competition, is deployed — nginx + docker
compose, not GitHub Pages; [`DEPLOYMENT.md`](DEPLOYMENT.md) is the walkthrough.

GitHub Pages is one site, one artifact, built by
`.github/workflows/pages-deploy.yml` on every push to `main`: a home page plus
`/jatekok/`, `/valto/` and `/proba-verseny/`, all under the one `SITE_ROOT`
constant in `scripts/assemble-site.mjs` that `npm run site:build` uses too.
**A push to `main` deploys the public site** — no staging step, no approval; the
workflow going green is the cutover.

The testers' dry run is the other Pages deploy and not part of that artifact:
`.github/workflows/dry-run-deploy.yml` publishes `apps/offline-frontend` to the
year's *private* repo's Pages, on demand only. The two workflows are guarded in
opposite directions, and `scripts/workflow-safety.test.mjs` pins both.

## Competition Secrecy

A new competition's game must stay secret until after the competition, so each
year has a private synced repo and the game is developed and deployed from there.
**Nothing about an unreleased game may appear in a public commit** — including
engine changes phrased around its needs. [`README.md`](README.md) §
*Competition secrecy* is the authority.

## Key Conventions

[`CONTRIBUTING.md`](CONTRIBUTING.md) routes here rather than restating this
section, and carries the few rules — commit subjects, test-file naming,
requesting a reviewer — written down nowhere else.

- Games are organized by type: `strategy/` (two-player), `relay/` (team relay)
- Each game's folder holds its wrapper, bot and board as separate files,
  registered in the three registries next to the folders — never through a folder
  barrel, so the `game`, `game/bot` and `game/client` entries stay apart
- Winner is tracked in `G.winner` state field
- Use Hungarian for user-facing text (the competition is in Hungarian). The
  strategy practice site is the exception: it has an HU/EN switcher (and a
  `?lang=` param). The relay practice site is pinned to Hungarian — `LANGUAGE` in
  `apps/relay-practise-frontend/src/App.tsx`
- **Formatting is ESLint's, through `@stylistic`, not prettier's.** The
  character-level rules live in `eslint.stylistic.mjs`, which both configs import
  and which says why a rule joins that set only if it fixes characters, never
  line breaks — layout here often carries meaning, and `--fix` must not rewrite
  it. Rules that decide where a line breaks stay per-workspace; `.editorconfig`
  settles indentation. Quote style is enforced only where the code already agrees
  on one. Generated lookup tables have the formatting rules switched off by name
  (`stylisticRulesOff`), which keeps every rule about meaning applying to them
- Comment what is not evident from the code — a rule the condition alone does not
  imply, a non-obvious invariant, why an apparently redundant branch exists. A
  comment restating the line below it is noise
- **A comment describes the code as it stands.** What it did before, and which
  change moved it, belong to the commit and the PR — no "previously", no "this
  PR removes". Where the past is the point, state it in the present, as a
  standing hazard. Suites are the exception: a regression test names its bug
- Say a thing once: rationale lives in the doc that owns the decision, and
  comments point at it rather than restating it
- Cover major new functionality with unit tests. For a new game that means the
  game logic first: move validators and the strategy — the pure functions where a
  wrong branch decides a competition. Trivial wiring (exports, registration,
  pass-through props) needs no tests, and exhausting every branch is not the goal
- Every regression fixed gets a unit test that fails without the fix, so the
  specific bug cannot quietly return
- A test run writes its report and nothing else: a console call during it fails
  the test that made it, and a test exercising a logging path on purpose stubs
  the method and asserts on the spy. `vitest.setup.mts` says why and how
- PRs are split by **atomicity, not size** — one independent change each, so a
  reviewer can accept or reject them separately
- Keep PR descriptions and review comments short. Say what changed and why, and
  stop; the diff, the commit messages and the linked docs carry the rest
- A PR body carries one Claude Code footer, and it is not the agent's to write —
  the integration appends one to every body it opens. A *comment* is the other
  way round: the duplicate is stripped there, so write it
- An agent opening a PR assigns the person it is working for, and names its
  session for what the work is about, not for the ticket alone — `#461 duplicate
  socket.io copy in the lockfile`, not `Issue 461 investigation`
- Permission to commit to someone else's branch is not permission to comment on
  their PR: ask first before posting to a thread you do not own
- Do not `@`-mention anyone not already involved in a thread: a mention is a
  notification. Naming a person plainly, or referring to their PR by number, says
  the same thing without pulling them in
