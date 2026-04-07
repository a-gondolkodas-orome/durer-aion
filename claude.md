# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive games, built on boardgame.io.

## Project Structure

This is a **Turborepo monorepo** with npm workspaces:

```
apps/
  online-frontend/    # React frontend for multiplayer (Vite)
  online-backend/     # Node.js server with boardgame.io + Koa
  offline-frontend/   # Standalone practice version (Vite)
packages/
  game/               # Game logic (boardgame.io games)
  strategy/           # AI/bot strategies for games
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
```

## Tech Stack

- **Frontend**: React 18, Vite, MUI (Material-UI), Recoil, React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsup
- **Testing**: Jest, React Testing Library

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

# Spell check
npm run spell-check
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
- `.env.docker` - Docker compose config (copy from `.env.docker.sample`)

## Docker Deployment

```bash
# Build and run with Docker Compose
docker compose --env-file=.env.docker up --build
```

## Key Conventions

- Games are organized by type: `strategy/` (two-player), `relay/` (team relay)
- Each game exports: `game`, `strategy`, `Board` component
- Use Hungarian for user-facing text (competition is in Hungarian)
- Winner is tracked in `G.winner` state field
