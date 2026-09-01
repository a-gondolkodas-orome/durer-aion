# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive games, built on boardgame.io.

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
  strategy/           # AI/bot strategy for the relay game (strategy games keep theirs in packages/game)
  engine/             # the strategy practice site's game engine: rules, moves, bots, match state, no framework
  games/              # competition games in that engine's format; only strategy-practice consumes it
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
pages/                # static content the Pages deploy serves but no app builds
```

**"Practice" alone is ambiguous — say which one.** The *strategy practice*
site (`apps/strategy-practice`, `/jatekok/`), the *relay practice* site
(`apps/relay-practise-frontend`, `/valto/`), and the offline *dry run*
(`apps/offline-frontend`, `/proba-verseny/`) are three different apps. The
first two are the practice sites; the dry run is a rehearsal of the
competition round, not a practice site.

**`apps/strategy-practice` is a workspace, but not like the others.** One root `npm ci`
installs it, and turbo builds and typechecks it with everything else — but it
keeps its own `eslint.config.js`, its own vitest setup and its own CI workflow.
`npm test` at the root still skips it — `npm run lint` does not. ESLint resolves
a config per directory as it walks, so one `eslint .` at the root lints this app
through *its* config and everything else through the root one, in one pass; only
the unit tests still run from `apps/strategy-practice`. What that ESLint config
differs on is the *rule set* — `@eslint-react`, react-hooks, and a stylistic
dialect (no trailing comma, single quotes, `max-len` 120) the root does not
impose. It is not a second
toolchain: eslint, typescript and vitest are pinned to the same versions as the
root and npm hoists them, its own plugins included. It came in as a subtree
merge from `durer-jatekok` with that dialect already set, and reconciling the
two would be a rewrite rather than a merge — so the two configs stay, and
ESLint applies each where it belongs. Its own [`AGENTS.md`](apps/strategy-practice/AGENTS.md) loads
automatically when you work under that directory and is the authority on
everything inside it — memory files nest by directory; settings do not.

**Do not run `npm ci` from `apps/strategy-practice`.** There is one lockfile, at the
root; from a workspace directory npm installs that workspace's subtree and
leaves the root's own dependencies unmet, which the other apps then fail to
build against. It exits 0 while doing it.

A plan to replace boardgame.io with the strategy practice engine was drafted and then
deprioritized — upstream is actively maintained again (issue #277); don't
build toward that replacement. Its remaining `npm audit` advisories are its own
transitive tree — `ws` through `koa-socket-2`, `@koa/cors@3`, `engine.io` — and
cannot be fixed from here. **Never run `npm audit fix --force`:** its fix for
them is `boardgame.io@0.22.1`, a four-year downgrade that would take the
competition with it. What is behind otherwise is `npm run report:outdated`'s
job, monthly.
[`docs/must-keep-working.md`](docs/must-keep-working.md) is the standing
regression checklist every change is measured against.

## Tech Stack

- **Frontend**: React 19, Vite, MUI (Material-UI), React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsdown. Each package's build config is
  `tsdown.config.mts`, not `.ts`: the packages ship CommonJS and so carry no
  `"type": "module"`, which leaves node guessing at the config's module system
  and warning about it on every build.
- **Testing**: vitest, React Testing Library. Suites are `*.test.ts(x)` under
  the root config and `*.spec.ts(x)` in `apps/strategy-practice`; both run through
  vitest, and neither uses Jest.
- **`apps/strategy-practice`** shares this React major, the root's eslint,
  typescript and vitest pins, and the same vite as the other frontends;
  Tailwind and its own build/test setup are what set it apart. See its
  `package.json` rather than assuming this one's.

## Development Commands

```bash
# Install dependencies, then create the gitignored .env files from their samples
npm ci
npm run setup

# The whole online round in docker: nginx + backend + postgres (detached)
npm run stack:up      # builds, then brings the stack up on http://localhost
npm run teams:import  # loads scripts/test.tsv, once postgres is accepting connections
npm run stack:ps      # which services are up, when a URL shows nothing
npm run stack:logs    # follow all three containers; Ctrl-C stops watching, not the stack
npm run stack:down

# The same thing without docker (except the DB), everything reloading
npm run db:up              # postgres (terminal 1)
npm run dev:server         # Backend on :8000 (terminal 2)
npm run dev:online         # Frontend on :5173 (terminal 3)
npm run teams:import:local

# Run offline frontend (the /proba-verseny/ dry run)
npm run dev:offline

# Run the relay practice site (/valto/)
npm run dev:relay-practice

# Build all packages
npm run build

# Lint
npm run lint

# Typecheck (tsc --noEmit per workspace, via turbo)
npm run typecheck

# Unit tests
npm test

# Translation key check
npm run i18n:check

# Spell check
npm run spell-check
```

`npm ci`, `npm run lint`, `npm run build`, `npm run typecheck` and
`npm run spell-check` cover `apps/strategy-practice` too; `npm test` does not —
*Project Structure* above says why. Its remaining checks run from that
directory, with no install of their own:

```bash
npm run dev:strategy-practice                     # from the root; it is a workspace
npm test --workspace=strategy-practice   # check:versions + lint + typecheck + unit
cd apps/strategy-practice && npm run coverage:patch
```

Every long docker invocation lives in a root npm script rather than in prose,
so it is written down once. [`README.md`](README.md) is the authority on
running things locally: how to bring the stack up, and — under *Checking it
works* — how to exercise each item of `docs/must-keep-working.md` by hand.

## Creating a New Game

The steps below are for a game in the *live competition* (boardgame.io). For
a game on the *strategy practice* site, the `new-game` skill under `apps/strategy-practice` is
the route — there a game is one self-contained folder: gameplay, bot, curated
start boards, board client and specs together.

1. Create the game as one self-contained folder in
   `packages/game/src/games/strategy/<game-name>/` — `stones/` and `19ocd/`
   are the live examples:
   - `game.ts` - boardgame.io game definition
   - `strategy.ts` - the server bot, plus any lookup tables it imports
   - `board.tsx` - React component for the game board
   - `main.tsx` - the game description shown to players
   - `index.ts` - re-exports

2. Register it in `packages/game/src/games/strategy/strategy-games.ts`. The
   apps import everything from the `game` package:
   `apps/online-backend/src/server.ts` wires the bot, the frontends the
   boards and descriptions.

**The live client must not ship the bot.** `apps/online-frontend` never
imports the strategy exports — only the backend does, and the offline
dry-run build deliberately does (its bot runs in the browser, after the
game is public). Tree-shaking of the `game` package's ESM build is all that
keeps the bot out of the served bundle, so one stray import from
`strategy.ts` into a board hands every competitor the bot's tables. No CI
gate covers this: after touching a game's imports, build and check by hand
that nothing distinctive to the bot — a lookup-table key, say — appears in
`apps/online-frontend/dist`.

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

A move takes as many arguments as you give it — `moves.changeCoins(K, L)` for
a "pick two values, then commit" turn, driven by form inputs rather than by a
click on the board. The two live games are both single-click, single-argument;
nothing in the wrapper requires that.

The opening position has two homes, and `GameMixin.startingPosition` in
`packages/game/src/common/types.ts` says which to pick.

## Environment Files

- `apps/online-backend/.env` - Backend config (copy from `.env.sample`)
- `apps/offline-frontend/.env` - Offline frontend config
- `apps/relay-practise-frontend/.env` - Relay practice frontend config
- `.env.docker`, `.env.local` - Docker compose config (copy from the `.sample` files)

`npm run setup` creates all of them from their samples, never overwriting one
that exists. The dev container runs it for you.

## Docker Deployment

```bash
# Build and run the production stack (no dev overlay)
npm run stack:prod
```

That is how `verseny.durerinfo.hu`, the real competition, is deployed — nginx +
docker compose, not GitHub Pages.

## GitHub Pages Deployment

One site, one artifact, built by `.github/workflows/pages-deploy.yml` on every
push to `main`: a home page plus `/jatekok/` (strategy practice), `/valto/`
(relay practice) and `/proba-verseny/` (the offline dry run). The whole prefix
comes from one `SITE_ROOT` constant in `scripts/assemble-site.mjs`, which both
the workflow and `npm run site:build` call — so `npm run site:serve` previews
the deploy's own code, not a copy of it.

**A push to `main` deploys the public site.** There is no staging step and no
separate approval — the workflow going green is the cutover.

## Competition Secrecy

A new competition's game must stay secret until after the competition, so each
year has a private synced repo and the game is developed and deployed from
there. **Nothing about an unreleased game may appear in a public commit** —
including engine changes phrased around its needs.
[`README.md`](README.md), under *Competition secrecy*, is the authority: how the
mirror works, and what to set up when the year's repo is created.

## Key Conventions

- Games are organized by type: `strategy/` (two-player), `relay/` (team relay)
- Each game's folder exports its game wrapper, strategy wrapper and board
  through its `index.ts`
- Use Hungarian for user-facing text (competition is in Hungarian); the
  strategy and relay practice sites also offer English through their own
  language switchers
- Winner is tracked in `G.winner` state field
- Comment what is not evident from the code — a rule the condition alone does
  not imply, a non-obvious invariant, why an apparently redundant branch
  exists. A comment restating the line below it is noise.
- Say a thing once: rationale lives in the doc that owns the decision, and
  comments point at it rather than restating it.
- Cover major new functionality with unit tests. For a new game that means the
  game logic first: move validators and the strategy — the pure functions where
  a wrong branch decides a competition. Trivial wiring (exports, registration,
  pass-through props) needs no tests, and exhausting every branch is not the
  goal: test the rules and the edge cases that could plausibly be gotten wrong.
- Every regression fixed gets a unit test that fails without the fix.
  [`docs/must-keep-working.md`](docs/must-keep-working.md) catches
  whole-feature breakage by hand; the test pins the specific bug so it cannot
  quietly return.
- PRs are split by **atomicity, not size** — one independent change each, so a
  reviewer can accept or reject them separately.
- An agent opening a PR assigns the person it is working for, so it lands in
  their queue rather than going unnoticed.
- Permission to commit to someone else's branch is not permission to comment on
  their PR. An agent asks first before posting to a thread it does not own — the
  commit messages already carry the reasoning, and the thread is the author's.
- Keep PR descriptions and review comments short. Say what changed and why, and
  stop; the diff, the commit messages and the linked docs carry the rest. Length
  is not thoroughness — it costs the reviewer the time the change was meant to
  save.
- Do not `@`-mention anyone not already involved in the thread: a mention is a
  notification. Naming a person plainly, or referring to their PR by number,
  says the same thing without pulling them in.
