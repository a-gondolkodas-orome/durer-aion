# syntax=docker/dockerfile:1.26.0
# `COPY --parents` below is stable only from Dockerfile frontend 1.20 on, and
# Docker Desktop ships an older one for a good while after a release. Naming
# the frontend here makes BuildKit fetch it, so the build does not depend on
# how recent the daemon's built-in version happens to be.

FROM node:24.20.0 AS deps

WORKDIR /usr/src/app

# Copy dependency metadata first (root + all workspaces)
COPY package.json package-lock.json turbo.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

# Install deps (cached unless package*.json or .npmrc change). The cache mount
# keeps npm's download cache across builds, so a lockfile change re-links the
# tree instead of refetching 900 packages over the network. It is a BuildKit
# cache, held by the builder rather than the image, so nothing lands in a layer.
RUN --mount=type=cache,target=/root/.npm npm ci

# The stage `docker-compose.dev.yml` builds: everything the watching dev server
# needs, and no server build. That build's output is the first thing
# `npm run dev:server` overwrites, so producing it here only made every
# `stack:up` after a source edit wait for a bundle nothing would read.
FROM deps AS dev

# Copy source code
COPY . .

# .dockerignore keeps credentials and team lists out of the context; this fails
# the build if one of those patterns ever stops matching. Docker matches a
# pattern against the whole path, so the `**/` prefixes are load-bearing and
# easy to drop by accident — that is how apps/online-backend/.env used to get
# baked in (#443). CI seeds the env files before building, so a regression
# surfaces in the docker job rather than in a deployed image. node_modules is
# pruned because npm ci has already filled it above.
RUN leaked=$(find . -name node_modules -prune -o \( -name '.env*' -o -name '*.tsv' \) -print); \
    if [ -n "$leaked" ]; then \
      echo "These must not reach the image — check .dockerignore:" >&2; \
      echo "$leaked" >&2; \
      exit 1; \
    fi

EXPOSE 8000

# Run the server that was just built. docker-compose.dev.yml overrides this with
# the watching dev server for local development.
CMD [ "npm", "run", "start", "--workspace=online-backend" ]

# Last, so it is the stage a plain `docker compose build` picks — that is what
# `npm run stack:build` (the CI gate) and `npm run stack:prod` get, and what a
# deployment runs. The leak check above guards this stage too, through `FROM`.
FROM dev AS prod

RUN npx turbo build --filter=online-backend
