# syntax=docker/dockerfile:1.26.0
# `COPY --parents` below is stable only from Dockerfile frontend 1.20 on, and
# Docker Desktop ships an older one for a good while after a release. Naming
# the frontend here makes BuildKit fetch it, so the build does not depend on
# how recent the daemon's built-in version happens to be.

FROM node:26.13.0 AS deps

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
# baked in (#443). Both names here are prefix globs for the same reason: the
# importer writes `<file>.tsv.export` next to the list it read, and `*.tsv`
# does not match it. CI seeds the env files before building, so a regression
# surfaces in the docker job rather than in a deployed image. node_modules is
# pruned because npm ci has already filled it above.
RUN leaked=$(find . -name node_modules -prune -o \( -name '.env*' -o -name '*.tsv*' \) -print); \
    if [ -n "$leaked" ]; then \
      echo "These must not reach the image — check .dockerignore:" >&2; \
      echo "$leaked" >&2; \
      exit 1; \
    fi

# The dev server, which docker-compose.dev.yml also names as its command.
CMD [ "npm", "run", "dev:server" ]

# The server bundle, built from the dev stage's tree, so the leak check above
# guards everything the production image takes from it.
FROM dev AS build

RUN npx turbo build --filter=online-backend

# The backend's runtime dependencies and nothing else, installed from the
# lockfile. The workspace packages it depends on (`game`, `schemas`, …) are
# inlined into the bundle from source (tsdown.config.mts), so they are dropped
# from its manifest first: left in, npm would install them and theirs, which for
# `game` means MUI and React. Listing them as devDependencies instead does not
# help: `--omit=dev` still installs a workspace and its dependencies. A workspace
# is whatever the lockfile records as a link, in any dependency field. npm ci
# takes the trimmed manifest, since every dependency left still matches the
# lockfile; the other workspaces' manifests are copied only because the lockfile
# names them.
FROM node:26.13.0 AS prod-deps

WORKDIR /usr/src/app

COPY package.json package-lock.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

RUN node -e " \
      const fs = require('fs'); \
      const file = 'apps/online-backend/package.json'; \
      const manifest = JSON.parse(fs.readFileSync(file)); \
      const lock = JSON.parse(fs.readFileSync('package-lock.json')).packages; \
      for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) \
        for (const name of Object.keys(manifest[field] ?? {})) \
          if (lock['node_modules/' + name]?.link) delete manifest[field][name]; \
      fs.writeFileSync(file, JSON.stringify(manifest, null, 2)); \
    "
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace=online-backend

# Last, so it is the stage a plain `docker compose build` picks — that is what
# `npm run stack:build` (the CI gate) and `npm run stack:prod` get, and what a
# deployment runs. It holds the bundle, its runtime dependencies and the team
# import script: no workspace source, no devDependencies, no npm (#705).
FROM node:26.13.0-slim AS prod

# Nothing in this image installs or runs a package script, so the package
# managers the base image ships are only attack surface.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

WORKDIR /usr/src/app

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps /usr/src/app/apps/online-backend ./apps/online-backend
COPY --from=build /usr/src/app/apps/online-backend/dist ./apps/online-backend/dist
# docker-compose.yml bind-mounts ./scripts over this, so this copy is what a
# container started without that mount has for `teams:import`.
COPY scripts/import_teams.sh ./scripts/

# The bundle keeps every npm dependency an external require(), including those
# only a workspace package declares, which the trim above leaves uninstalled.
# The server's sanity-check mode loads every module both entries require and
# exits, so a missing one fails this build rather than the deployed server.
RUN node apps/online-backend/dist/server.js sanity-check

EXPOSE 8000

CMD [ "node", "--enable-source-maps", "apps/online-backend/dist/server.js" ]
