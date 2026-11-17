# syntax=docker/dockerfile:1.26.0
# Pinned so BuildKit fetches it: `COPY --parents` needs frontend 1.20+, and
# Docker Desktop's built-in one lags behind.

# check-versions.test.mjs holds this to .nvmrc.
ARG NODE_VERSION=26.13.0

FROM node:${NODE_VERSION} AS deps

WORKDIR /usr/src/app

COPY package.json package-lock.json turbo.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

# The cache mount keeps npm's download cache across builds, outside any layer.
RUN --mount=type=cache,target=/root/.npm npm ci

# What docker-compose.dev.yml runs. No server build: the watcher rebuilds at
# once anyway.
FROM deps AS dev

COPY . .

# Fails the build if .dockerignore stops keeping credentials and team lists out
# (#443). The trailing `*` also catches the importer's `<file>.tsv.export`.
RUN leaked=$(find . -name node_modules -prune -o \( -name '.env*' -o -name '*.tsv*' \) -print); \
    if [ -n "$leaked" ]; then \
      echo "These must not reach the image — check .dockerignore:" >&2; \
      echo "$leaked" >&2; \
      exit 1; \
    fi

# Stays root, unlike prod: the watchers write into the image's workspace and
# into the anonymous dist volume docker-compose.dev.yml mounts, both root-owned.
# It is a local convenience, never deployed.
CMD [ "npm", "run", "dev:server" ]

# From dev, so the leak check guards what prod takes from here.
FROM dev AS build

RUN npx turbo build --filter=online-backend

# The backend's runtime dependencies, plus those of the workspace packages
# bundled into it; `game`'s MUI and React are peers, so they stay out. Every
# manifest is copied because the lockfile names them all.
FROM node:${NODE_VERSION} AS prod-deps

WORKDIR /usr/src/app

COPY package.json package-lock.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace=online-backend

# Last, so a plain `docker compose build` (stack:build, stack:prod) picks it.
# Bundle, runtime dependencies and the team import script only (#705).
FROM node:${NODE_VERSION}-slim AS prod

# Package managers are only attack surface here. The loop catches one a future
# base image ships that the `rm` misses.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx; \
    for tool in npm npx corepack yarn yarnpkg pnpm; do \
      if command -v "$tool"; then echo "$tool is still in the runtime image" >&2; exit 1; fi; \
    done

WORKDIR /usr/src/app

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps /usr/src/app/apps/online-backend ./apps/online-backend
COPY --from=build /usr/src/app/apps/online-backend/dist ./apps/online-backend/dist
# For a container started without docker-compose.yml's ./scripts mount.
COPY scripts/import_teams.sh ./scripts/

# Loads the modules the server requires at startup, so a dependency prod-deps
# left out fails the build, not the deployment.
RUN node apps/online-backend/dist/server.js sanity-check

# Unprivileged: everything above is root-owned and only read from here on. The
# one write, the importer's `<file>.tsv.export`, goes to the bind-mounted
# scripts/, so the import runs as the host user instead (DEPLOYMENT.md § 7).
USER node

EXPOSE 8000

CMD [ "node", "--enable-source-maps", "apps/online-backend/dist/server.js" ]
