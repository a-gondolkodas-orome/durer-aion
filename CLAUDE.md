# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive games, built on boardgame.io.

## Project Structure

This is a **Turborepo monorepo** with npm workspaces:

```
apps/
  online-frontend/    # React frontend for multiplayer (Vite)
  online-backend/     # Node.js server with boardgame.io + Koa
  offline-frontend/   # Standalone practice version (Vite)
  strategy-practice/  # the public strategy game practice site (from the durer-jatekok repo)
packages/
  game/               # Game logic (boardgame.io games)
  strategy/           # AI/bot strategies for games
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
pages/                # static content the Pages deploy serves but no app builds
```

**`apps/strategy-practice` is a workspace, but not like the others.** One root `npm ci`
installs it, and turbo builds and typechecks it with everything else — but it
keeps its own ESLint, TypeScript and Vite versions (npm nests them), its own
`eslint.config.js`, its own vitest setup and its own CI workflow. So the root's
`npm run lint` and `npm test` still skip it, and its checks run from
`apps/strategy-practice`. Its own [`AGENTS.md`](apps/strategy-practice/AGENTS.md) loads
automatically when you work under that directory and is the authority on
everything inside it — memory files nest by directory; settings do not.

**Do not run `npm ci` from `apps/strategy-practice`.** There is one lockfile, at the
root; from a workspace directory npm installs that workspace's subtree and
leaves the root's own dependencies unmet, which the other apps then fail to
build against. It exits 0 while doing it.

A plan to replace boardgame.io with practice's engine was drafted and then
deprioritized — upstream is actively maintained again (issue #277); don't
build toward that replacement.
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
- **`apps/strategy-practice`** is on the same React major but its own Vite/TS/ESLint
  versions, plus Tailwind. See its `package.json` rather than assuming this one's.

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

# Run offline frontend (practice mode)
npm run dev:offline

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

`npm ci`, `npm run build` and `npm run typecheck` cover `apps/strategy-practice` too;
`npm run lint` and `npm test` do not, because it has its own ESLint and vitest
setups. Its own checks run from that directory, with no install of their own:

```bash
npm run dev:practice                     # from the root; it is a workspace
npm test --workspace=strategy-practice   # check:versions + lint + typecheck + unit
cd apps/strategy-practice && npm run coverage:patch
```

Every long docker invocation lives in a root npm script rather than in prose,
so it is written down once. [`README.md`](README.md) is the authority on
running things locally: how to bring the stack up, and — under *Checking it
works* — how to exercise each item of `docs/must-keep-working.md` by hand.

## Creating a New Game

The steps below are for a game in the *live competition* (boardgame.io). For
a game on the *practice* site, the `new-game` skill under `apps/strategy-practice` is
the route — there a game is one self-contained folder: gameplay, bot, curated
start boards, board client and specs together.

1. Create game files in `packages/game/src/games/<game-name>/`:
   - `game.ts` - boardgame.io game definition
   - `index.ts` - exports

2. Create strategy in `packages/strategy/src/games/<game-name>/`:
   - `strategy.ts` - bot/AI logic

3. Create board UI in `packages/common-frontend/src/client/`:
   - `board.tsx` - React component for game board

4. Register the game in:
   - Frontend index/lobby files
   - Server configuration

### Game Structure (boardgame.io)

```typescript
{
  setup: () => G,                    // Initial game state
  moves: {
    moveName: ({ G, ctx }) => void,  // Player actions
  },
  // Optional:
  startingPosition: ({ G, ctx }) => G,
  possibleMoves: ({ G, ctx }) => Move[],
  turn: {
    minMoves: 1,
    maxMoves: 1,
    endIf: ({ G, ctx }) => boolean,
  },
}
```

## Environment Files

- `apps/online-backend/.env` - Backend config (copy from `.env.sample`)
- `apps/offline-frontend/.env` - Offline frontend config
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
push to `main`: a home page plus `/jatekok/` (practice), `/valto/` (a frozen
2023 relay build) and `/proba-verseny/` (the offline dry run). The whole prefix
comes from one `SITE_ROOT` constant in `scripts/assemble-site.mjs`, which both
the workflow and `npm run site:build` call — so `npm run site:serve` previews
the deploy's own code, not a copy of it. See
[`docs/pages-consolidation.md`](docs/pages-consolidation.md).

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
- Each game exports: `game`, `strategy`, `Board` component
- Use Hungarian for user-facing text (competition is in Hungarian); both
  practice sites also offer English through their own language switchers
- Winner is tracked in `G.winner` state field
- Comment what is not evident from the code — a rule the condition alone does
  not imply, a non-obvious invariant, why an apparently redundant branch
  exists. A comment restating the line below it is noise.
- Say a thing once: rationale lives in the doc that owns the decision, and
  comments point at it rather than restating it.
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
