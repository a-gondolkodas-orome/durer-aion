# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive games, built on boardgame.io.

## Project Structure

This is a **Turborepo monorepo** with npm workspaces:

```
apps/
  online-frontend/    # React frontend for multiplayer (Vite)
  online-backend/     # Node.js server with boardgame.io + Koa
  offline-frontend/   # Standalone practice version (Vite)
  practice/           # the public strategy game practice site (durer-jatekok)
packages/
  game/               # Game logic (boardgame.io games)
  strategy/           # AI/bot strategies for games
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
pages/                # static content the Pages deploy serves but no app builds
```

**`apps/practice` is not a workspace yet.** It came from a separate repository
and still has its own `package-lock.json`, its own `npm ci`, its own ESLint and
its own toolchain pins. The root's lint, test, typecheck, build and spell-check
deliberately skip it, and it is gated by its own CI workflow instead. Work on it
from `apps/practice`, not from the root. Its own
[`AGENTS.md`](apps/practice/AGENTS.md) loads automatically when you work under
that directory and is the authority on everything inside it — memory files nest
by directory; settings do not.

The whole repo is being reshaped: see
[`docs/boardgame-io-replacement-plan.md`](docs/boardgame-io-replacement-plan.md),
the coordination artifact for replacing boardgame.io with practice's engine, and
[`docs/must-keep-working.md`](docs/must-keep-working.md), the standing
regression checklist every change is measured against.

## Tech Stack

- **Frontend**: React 18, Vite, MUI (Material-UI), Recoil, React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsup
- **Testing**: vitest, React Testing Library. Suites are `*.test.ts(x)` under
  the root config and `*.spec.ts(x)` in `apps/practice`; both run through
  vitest, and neither uses Jest.
- **`apps/practice`** is its own stack: React 19, its own Vite/TS/ESLint
  versions, Tailwind. See its `package.json` rather than assuming this one's.

## Development Commands

```bash
# Install dependencies
npm ci

# Run offline frontend (practice mode)
npm run dev:offline

# Run online backend + frontend (requires PostgreSQL)
npm run dev:server    # Backend (terminal 1)
npm run dev:online    # Frontend (terminal 2)

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

None of the above reach `apps/practice`. Its equivalents run from that
directory:

```bash
cd apps/practice
npm ci
npm run dev
npm test              # check:versions + lint + typecheck + unit
npm run coverage:patch
```

## Database Setup (for online mode)

Start PostgreSQL via Docker:
```bash
docker run -it --rm -e POSTGRESQL_PASSWORD=postgres -p 127.0.0.1:5432:5432 bitnami/postgresql
```

Import test teams:
```bash
./scripts/import_teams.sh scripts/test.tsv
```

## Creating a New Game

**Check the migration plan before building on this shape.** Phases 1–2 replace
it with practice's `strategyGameFactory`, where a game is one self-contained
folder — gameplay, bot, curated start boards, board client and specs together.
A new game written the old way becomes migration debt. For a game on the
*practice* site, the `new-game` skill under `apps/practice` is the current
route.

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

The dev container seeds every `*.sample` it finds; outside it, copy them by hand.

## Docker Deployment

```bash
# Build and run with Docker Compose
docker compose --env-file=.env.docker up --build
```

That is how `verseny.durerinfo.hu`, the real competition, is deployed — nginx +
docker compose, not GitHub Pages.

## GitHub Pages Deployment

One site, one artifact, built by `.github/workflows/pages-deploy.yml` on every
push to `main`: a home page plus `/jatekok/` (practice), `/valto/` (a frozen
2023 relay build) and `/proba-verseny/` (the offline dry run). The whole prefix
comes from one `SITE_ROOT` variable in that workflow. See
[`docs/pages-consolidation.md`](docs/pages-consolidation.md).

**A push to `main` deploys the public site.** There is no staging step and no
separate approval — the workflow going green is the cutover.

## Competition Secrecy

A new competition's game must stay secret until after the competition, which is
why each year has a private synced repo: `sync.yml` mirrors any pushed `sync-*`
branch into it, the game is developed and deployed from there, and a merge-back
PR publishes it afterwards. Nothing about an unreleased game may appear in a
public commit — including engine changes phrased around its needs. The migration
plan's *Competition secrecy* section has the details.

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
